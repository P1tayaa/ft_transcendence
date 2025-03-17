import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db import models
from asgiref.sync import sync_to_async
from django.core.exceptions import ValidationError
from channels.db import database_sync_to_async
from apps.game.models import GameRoom, TournamentRoom
from django.db import transaction
from django.contrib.auth.models import User

class MatchmakingQueue(models.Model):
	player = models.ForeignKey(User, related_name = 'matchmaking_queue', on_delete = models.CASCADE)    
	joined_at = models.DateTimeField(auto_now_add=True)
	status = models.CharField(max_length=20, choices = (
			('QUEUED', 'In Queue'),
			('MATCHED', 'Match Found'),
			('CANCELLED', 'Cancelled')
		), default = 'QUEUED')

	@classmethod
	def find_random_match(cls, player):
		with transaction.atomic():
			if cls.objects.filter(player=player, status='QUEUED').exists():
				raise ValidationError("Already in queue")

			available_room = GameRoom.get_available_rooms().first()

			if available_room:
				available_room.join_game(player)
				return available_room
			else:
				cls.objects.create(player=player)
				return None

	def cancel_queue(self):
		if self.status == 'QUEUED':
			self.status == 'CANCELLED'
			self.save()


class MatchmakingConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.channel_layer.group_add(
			"matchmaking",
			self.channel_name
		)
		await self.accept()

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			"matchmaking",
			self.channel_name,
		)
		if hasattr(self, 'queue_entry'):
			await database_sync_to_async(self.queue_entry.cancel_queue)()

	async def receive(self, text_data):
		data = json.loads(text_data)
		message_type = data.get('type')

		if message_type == 'list_rooms':
			# Get tournaments correctly
			get_tournaments = database_sync_to_async(TournamentRoom.get_available_tournaments)
			tournaments = await get_tournaments()
			
			# Process tournament data
			def format_tournaments():
				return [{
					'id': t.id,
					'name': t.tournament_name,
					'creator': t.creator.username,
					'participants': t.participants.count(),
					'max_participants': t.max_participants,
					'config': {
						'mode': t.config.mode,
						'map_style': t.config.map_style,
						'powerups_enabled': t.config.powerups_enabled
					}
				} for t in tournaments]
			
			tournament_data = await database_sync_to_async(format_tournaments)()
			
			# Get game rooms correctly
			get_rooms = database_sync_to_async(GameRoom.get_available_rooms)
			rooms = await get_rooms()
			
			# Process room data
			def format_rooms():
				return list(rooms.values(
					'room_name',
					'config__mode',
					'config__player_count',
					'config__map_style',
					'config__powerups_enabled',
					'config__powerup_list',
					'config__player_sides',
					'config__bots_enabled',
					'config__bot_sides',
					'config__is_host',
					'config__spectator_enabled'
				))
			
			rooms_data = await database_sync_to_async(format_rooms)()
			
			# Format the rooms data as before
			formatted_rooms = [{
				'room_name': room['room_name'],
				'config': {
					'mode': room['config__mode'],
					'playerCount': room['config__player_count'],
					'map_style': room['config__map_style'],
					'powerup': str(room['config__powerups_enabled']),
					'poweruplist': room['config__powerup_list'],
					# other fields...
				}
			} for room in rooms_data]
			await self.send(json.dumps({
				'type': 'room_list',
				'rooms': formatted_rooms,
				'tournaments': tournament_data
			}))

	async def game_created(self, event):
		await self.send(json.dumps({
			   'type': 'new_game_notification',
			   'room': event['room'],
		   }))
		
	async def tournament_update(self, event):
		await self.send(json.dumps({
				   'type': 'tournament_update',
				   'tournament_data': event['tournament_data']
			   }))
		
