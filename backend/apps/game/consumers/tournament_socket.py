import json
import logging
from channels.db import database_sync_to_async
from apps.game.models.tournament import Tournament
from apps.game.consumers.consumers import BaseConsumer
import traceback

# Set up logger
logger = logging.getLogger(__name__)

class TournamentConsumer(BaseConsumer):
	"""WebSocket consumer for tournaments"""

	active_tournaments = {}

	async def connect(self):
		await super().connect()

		self.tournament_name = self.scope['url_route']['kwargs']['tournament_name']
		self.group_name = f'tournament_{self.tournament_name}'

		if not self.user:
			logger.warning(f"Unauthorized connection attempt to tournament {self.tournament_name}")
			await self.close()
			return

		await self.channel_layer.group_add(
			self.group_name,
			self.channel_name
		)
		await self.accept()
		logger.info(f"User {self.user.username} (ID: {self.user.id}) connected to tournament {self.tournament_name}")

		# Join or reconnect to the tournament
		tournament_data = await self.join_tournament()

		if not tournament_data:
			logger.warning(f"User {self.user.username} failed to join tournament {self.tournament_name}")
			await self.close()
			return

		await self.broadcast_tournament_state()

	@database_sync_to_async
	def join_tournament(self):
		"""Join or reconnect to a tournament"""
		try:
			tournament = Tournament.objects.get(name=self.tournament_name)

			# Check if reconnect
			if tournament.players.filter(user=self.user).exists():
				logger.info(f"User {self.user.username} reconnected to tournament {self.tournament_name}")
				return {
					'tournament': tournament,
					'reconnected': True
				}

			# New join - only if tournament is in waiting state
			if tournament.status != 'waiting':
				logger.warning(f"User {self.user.username} tried to join tournament {self.tournament_name} which is already in progress")
				return None

			player_data = tournament.join(self.user)
			if not player_data:
				return None

			logger.info(f"User {self.user.username} joined tournament {self.tournament_name}")
			return {
				'tournament': tournament,
				'reconnected': False
			}

		except Exception as e:
			logger.error(f"Error joining tournament: {str(e)}")
			return None


	async def disconnect(self, close_code):
		"""Handle disconnection from the WebSocket"""
		tournament = await self.get_tournament()

		if not tournament:
			logger.warning(f"User {self.user.username} disconnected from tournament {self.tournament_name} but tournament does not exist")
			return

		# If tournament hasn't started yet (is in waiting state), leave the tournament
		if tournament.status == 'waiting':
			logger.info(f"User {self.user.username} leaving tournament {self.tournament_name} on disconnect")
			await self.leave_tournament()
			await self.broadcast_tournament_state()

		# Remove from channel group
		if hasattr(self, 'group_name'):
			await self.channel_layer.group_discard(
				self.group_name,
				self.channel_name
			)

	@database_sync_to_async
	def get_tournament(self):
		"""Get tournament object from the database"""
		try:
			return Tournament.objects.get(name=self.tournament_name)
		except Tournament.DoesNotExist:
			logger.warning(f"Tournament {self.tournament_name} does not exist")
			return None

	@database_sync_to_async
	def leave_tournament(self):
		"""Player leaves the tournament"""
		try:
			tournament = Tournament.objects.get(name=self.tournament_name)
			result = tournament.leave(self.user)
			return {'success': result}
		except Exception as e:
			logger.error(f"Error leaving tournament: {str(e)}")
			return {'success': False, 'error': str(e)}

	@database_sync_to_async
	def get_tournament_state(self):
		"""Get current tournament state from the database"""
		tournament = Tournament.objects.get(name=self.tournament_name)
		return tournament.get_status()

	async def broadcast_tournament_state(self):
		"""Send tournament state to all clients in the tournament group"""
		state = await self.get_tournament_state()
		await self.channel_layer.group_send(
			self.group_name,
			{
				'type': 'broadcast_state',
				'state': state
			}
		)


	async def receive(self, text_data):
		"""Process messages from client"""
		try:
			data = json.loads(text_data)
			message_type = data.get('type')

			if message_type == 'start_tournament':
				await self.handle_start_tournament()
			else:
				logger.warning(f"Unknown message type: {message_type}")

		except json.JSONDecodeError:
			logger.warning("Received invalid JSON data")
		except Exception as e:
			logger.error(f"Error processing message: {str(e)}\n{traceback.format_exc()}")

	@database_sync_to_async
	def start_tournament(self):
		"""Start the tournament if conditions are met"""
		try:
			tournament = Tournament.objects.get(name=self.tournament_name)

			# Check if user is the creator
			if tournament.creator_id != self.user.id:
				return {
					'success': False,
					'error': 'Only the tournament creator can start the tournament'
				}

			# Try to start the tournament
			result = tournament.start()
			if result:
				return {'success': True}
			else:
				return {'success': False, 'error': 'Tournament could not be started'}

		except Exception as e:
			logger.error(f"Error starting tournament: {str(e)}")
			return {'success': False, 'error': str(e)}

	async def handle_start_tournament(self):
		"""Handle start tournament request from client"""
		result = await self.start_tournament()

		if result and result.get('success'):
			# Broadcast updated state to all clients
			await self.broadcast_tournament_state()

			# Send tournament started message to everyone
			await self.channel_layer.group_send(
				self.group_name,
				{
					'type': 'tournament_started'
				}
			)
		else:
			# Send error back to client
			await self.send(text_data=json.dumps({
				'type': 'error',
				'message': result.get('error', 'Unknown error')
			}))

	# Event handlers for channel messages
	async def broadcast_state(self, event):
		"""Forward state broadcast to the client"""
		await self.send(text_data=json.dumps({
			'type': 'tournament_state',
			'state': event['state']
		}))

	async def tournament_started(self, event):
		"""Handle tournament started event"""
		await self.send(text_data=json.dumps({
			'type': 'tournament_started'
		}))

