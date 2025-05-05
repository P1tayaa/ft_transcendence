import json
import asyncio
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.exceptions import ValidationError
from channels.db import database_sync_to_async
from apps.game.models.game import GameRoom
from django.contrib.auth.models import User
from django.conf import settings
import jwt

# Set up logger
logger = logging.getLogger(__name__)

class BaseConsumer(AsyncWebsocketConsumer):
	@database_sync_to_async
	def get_user(self):
		 # Get headers from scope
		headers = dict(self.scope['headers'])

		# Get cookie header (it's in bytes format)
		cookie_header = headers.get(b'cookie', b'').decode()

		# Parse cookies - simple method:
		cookies = {}
		if cookie_header:
			cookie_pairs = cookie_header.split('; ')
			for pair in cookie_pairs:
				key, value = pair.split('=', 1)
				cookies[key] = value

		# Get your auth token from cookies
		token = cookies.get('auth-token')

		if not token:
			return None

		try:
			payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
			user_id = payload['user_id']
			return User.objects.get(id=user_id)
		except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
			return None

	async def connect(self):
		self.user = await self.get_user()

class GameConsumer(BaseConsumer):
	active_games = {}

	async def connect(self):
		await super().connect()
		self.room_name = self.scope['url_route']['kwargs']['room_name']
		self.room_group_name = f'room_{self.room_name}'

		if not self.user:
			logger.warning(f"Unauthorized connection attempt to room {self.room_name} - closing connection")
			await self.close()
			return

		await self.channel_layer.group_add(
			self.room_group_name,
			self.channel_name
		)

		await self.accept()
		logger.info(f"User {self.user.username} (ID: {self.user.id}) connected to room {self.room_name}")

		self.player_id = str(self.user.id)
		self.player_position = None

		self.running = False
		self.game_state = None
		self.game_loop = None

		try:
			# Join the game room when connecting
			join_result = await database_sync_to_async(GameRoom.join_game)(self.room_name, self.user)

			if not join_result:
				logger.warning(f"User {self.user.username} (ID: {self.user.id}) failed to join room {self.room_name}")
				await self.close()
				return

			self.game_room = join_result['room']
			player_data = join_result['player']
			self.tournament = join_result['tournament']

			# Initialize game state or get existing one
			if self.room_name in GameConsumer.active_games:
				self.game_state = GameConsumer.active_games[self.room_name]
				logger.info(f"Using existing game state for room {self.room_name}")
			else:
				self.game_state = self.create_initial_game_state()
				GameConsumer.active_games[self.room_name] = self.game_state
				logger.info(f"Created new game state for room {self.room_name}")

			 # Add player to game state
			self.add_player(player_data)
			logger.info(f"Player {player_data['username']} (ID: {self.player_id}) added to game state")

			 # Store the player's position for easy access
			self.player_position = player_data['side']

			# Start game loop if game is in progress
			if self.game_room.status == 'in_progress' and not self.running:
				self.running = True
				self.game_loop = asyncio.create_task(self.run_game_loop())

			# Tell client which paddle they control
			await self.send(text_data=json.dumps({
				'type': 'which_paddle',
				'position': player_data['side']
			}))

			# Send initial game state
			logger.info("Sending initial game state")
			await self.broadcast_game_state()

		except Exception as e:
			import traceback
			logger.info(f"Error in game room connection: {str(e)}\n{traceback.format_exc()}")
			await self.send(text_data=json.dumps({
				'type': 'error',
				'message': str(e),
				'traceback': traceback.format_exc()
			}))
			await self.close()

	async def disconnect(self, close_code):
		if hasattr(self, 'game_room') and hasattr(self, 'user'):
			try:
				if self.running:
					await self.end_game()
				else:
					await self.leave()

			except Exception as e:
				logger.error(f"Error handling disconnect: {str(e)}")

		# Continue with standard disconnect
		if hasattr(self, 'user') and self.user:
			logger.info(f"User {self.user.username} (ID: {self.user.id}) disconnected from room {self.room_name}. Code: {close_code}")
		else:
			logger.info(f"Anonymous user disconnected from room {self.room_name}. Code: {close_code}")
		await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

	async def end_game(self):
		"""Handle ending a game when a player disconnects during gameplay"""
		logger.info(f"Game in progress during disconnect, recording final scores")

		# Convert position-based scores to player ID-based scores for the database
		player_id_scores = {}
		for player in self.game_state['players']:
			position = player['position']
			if position in self.game_state['score']:
				player_id_scores[str(player['id'])] = self.game_state['score'][position]

		result = await self.get_game_result(player_id_scores)

		# Get winner from game result
		winner = None
		for player_result in result['players']:
			if player_result['is_winner']:
				winner = player_result

		# Send game_over notification
		await self.channel_layer.group_send(
			self.room_group_name, {
			'type': 'game_over',
			'result': result,
			'winner': winner,
			'tournament': await self.get_tournament_info(),
		})
		
		# Cancel game loop
		self.running = False
		if hasattr(self, 'game_loop') and self.game_loop:
			self.game_loop.cancel()

		del GameConsumer.active_games[self.room_name]

	# End the game in the database - this returns the game result
	@database_sync_to_async
	def get_game_result(self, player_id_scores):
		"""End the game in the database and return the game result"""
		result = None

		if hasattr(self, 'game_room'):
			result = self.game_room.end(player_id_scores)

		if not result:
			raise ValidationError("Game result not found")
		
		result = result.get_results()

		if not result:
			raise ValidationError("Game result not found")

		return result

	@database_sync_to_async
	def get_tournament_info(self):
		"""Get tournament information if this game is part of a tournament"""
		try:
			if self.tournament:
				logger.info(f"Tournament match found: {self.tournament}")
				return {
					'id': self.tournament.id,
					'name': self.tournament.name,
				}
		except Exception as e:
			logger.error(f"Error getting tournament info: {str(e)}")
			return None

	async def leave(self):
		"""Handle a player leaving the game"""
		await database_sync_to_async(self.game_room.leave)(self.user)

		player = next((p for p in self.game_state['players']
					if str(p['id']) == self.player_id), None)

		if player:
			# Clean up references to this player
			if self.player_position in self.game_state['settings']['paddleLoc']:
				del self.game_state['settings']['paddleLoc'][self.player_position]
			if self.player_position in self.game_state['settings']['paddleSize']:
				del self.game_state['settings']['paddleSize'][self.player_position]

			# Remove player from players list
			self.game_state['players'].remove(player)

			# Remove player score
			if self.player_position in self.game_state['score']:
				del self.game_state['score'][self.player_position]

			# Check if we need to update the host
			was_host = player.get('is_host', False)
			if was_host and self.game_state['players']:
				await self.reassign_host()

			await self.broadcast_game_state()

		await self.close()

	async def reassign_host(self):
		"""Reassign host role after the host leaves"""
		 # Only proceed if we have players
		if self.game_state['players']:
			# Set all players' is_host to False
			for player in self.game_state['players']:
				player['is_host'] = False

			# Make the first player in the list the new host
			self.game_state['players'][0]['is_host'] = True
			new_host_id = self.game_state['players'][0]['id']
			logger.info(f"Host role reassigned to player {new_host_id}")

	@database_sync_to_async
	def get_player_data(self):
		"""Get player information from the database"""
		logger.info(f"Fetching player data for user {self.user.username} (ID: {self.user.id})")
		try:
			player = self.game_room.players.get(user=self.user)
			return {
				'id': player.user.id,
				'username': player.user.username,
				'side': player.side,
			}
		except:
			return None

	def create_initial_game_state(self):
		return {
			'score': {},
			'players': [],
			'settings': {
				'paddleSize': {},
				'paddleLoc': {},
			},
			'pongLogic': {
				'ballPos': {'x': 0, 'y': 0},
				'ballSpeed': {'x': 0.2, 'y': 0.1},
				'ballSize': {'x': 1, 'y': 1},
				'lastWinner': None,
				'lastLoser': None,
			}
		}

	def add_player(self, player_data):
		logger.info(f"Adding player {player_data['username']} (ID: {player_data['id']}) to game state")
		player_id = str(player_data['id'])
		player_position = player_data['side']

		# Only add if not already present
		if any(str(p['id']) == player_id for p in self.game_state['players']):
			return

		self.game_state['players'].append({
			'id': player_data['id'],
			'username': player_data['username'],
			'position': player_position,
			'is_host': len(self.game_state['players']) == 0,
			'is_ready': True
		})

		self.game_state['score'][player_position] = 0
		self.game_state['settings']['paddleLoc'][player_position] = {'position': 0, 'rotation': 0}
		if player_position in ['left', 'right']:
			self.game_state['settings']['paddleSize'][player_position] = {'x': 1, 'y': 8}
		else:
			self.game_state['settings']['paddleSize'][player_position] = {'x': 8, 'y': 1}

	async def receive(self, text_data):
		data = json.loads(text_data)
		type = data.get('type')

		if type == 'paddle_move':
			await self.handle_paddle_move(data)
		elif type == 'set_ball_velocity':
			await self.handle_ball_velocity(data)
		elif type == 'update_score':
			await self.handle_update_score(data)
		elif type == 'reset_round':
			await self.handle_reset_round(data)
		elif type == 'start_game':
			await self.handle_start_game()
		else:
			logger.warning(f"Unknown message type: {type}")

	async def handle_reset_round(self, data):
		self.game_state['pongLogic']['ballPos'] = {'x': 0, 'y': 0}
		self.game_state['pongLogic']['ballSpeed'] = {'x': 0, 'y': 0}
		self.game_state['pongLogic']['lastWinner'] = data.get('lastWinner')
		self.game_state['pongLogic']['lastLoser'] = data.get('lastLoser')

		await self.channel_layer.group_send(self.room_group_name, {'type': 'reset_round'})
		await self.broadcast_game_state()

	async def handle_update_score(self, data):
		scoring_position = data.get('scoring_position')
		logger.info(f"Updating score for position: {scoring_position}, current score: {self.game_state['score']}")
		# Directly update score by position
		if scoring_position in self.game_state['score']:
			self.game_state['score'][scoring_position] += 1

		# Check if the game is over
		if self.game_state['score'][scoring_position] == 5:
			await self.end_game()

	async def handle_ball_velocity(self, data):
		self.game_state['pongLogic']['ballSpeed'] = {
			'x': data['x'],
			'y': data['y']
		}

	async def handle_paddle_move(self, data):
		self.game_state['settings']['paddleLoc'][self.player_position] = {
			'position': float(data['position']),
			'rotation': float(data['rotation'])
		}
		await self.broadcast_game_state()

	async def handle_start_game(self):
		player = next((p for p in self.game_state['players'] if str(p['id']) == self.player_id), None)

		logger.info(f"Start game request from {self.user.username} (ID: {self.user.id})")

		# Only host can start game
		if not player or not player.get('is_host'):
			return

		try:
			# Verify all players are ready
			if not all(player['is_ready'] for player in self.game_state['players']):
				return

			# Set game status to in_progress
			self.game_room.status = 'in_progress'
			await database_sync_to_async(self.game_room.save)()

			# Start game loop
			self.running = True
			self.game_loop = asyncio.create_task(self.run_game_loop())

			# Broadcast state update
			await self.broadcast_game_state()

			# Notify all clients the game started
			await self.channel_layer.group_send(self.room_group_name, {'type': 'started_game'})

		except Exception as e:
			import traceback
			await self.send(text_data=json.dumps({
				'type': 'error',
				'message': str(e),
				'traceback': traceback.format_exc()
			}))

	async def broadcast_game_state(self, extra=None):
		"""Send game state to all clients in the room"""
		event = {
			'type': 'game_state_update',
			'state': self.game_state
		}
		if extra:
			event.update(extra)

		await self.channel_layer.group_send(
			self.room_group_name,
			event
		)

	async def run_game_loop(self):
		"""Game physics update loop"""
		try:
			while self.running:
				self.game_state['pongLogic']['ballPos']['x'] += (self.game_state['pongLogic']['ballSpeed']['x'])
				self.game_state['pongLogic']['ballPos']['y'] += (self.game_state['pongLogic']['ballSpeed']['y'])
				await self.broadcast_game_state()
				await asyncio.sleep(1/60)  # 60 FPS
		except asyncio.CancelledError:
			# Handle cancellation gracefully
			pass
		except Exception as e:
			import traceback
			print(f"Game loop error: {str(e)}")
			print(traceback.format_exc())
			self.running = False

	async def game_state_update(self, event):
		await self.send(text_data=json.dumps(event))

	async def which_paddle(self, event):
		await self.send(text_data = json.dumps({
			'type': 'which_paddle',
			'position': event['position']
		}))
		
	async def game_over(self, event):
		"""Send game over notification to clients"""
		await self.send(text_data=json.dumps({
			'type': 'game_over',
			'result': event['result'],
			'winner': event['winner'],
			'tournament': event['tournament']
		}))

	async def started_game(self, event):
		await self.send(text_data = json.dumps({
			'type': 'started_game',
			'side': self.player_position,
		}))

	async def failed_to_start_game(self, event):
		await self.send(text_data = json.dumps(event))

	async def reset_round(self, event):
		await self.send(text_data = json.dumps(event))
