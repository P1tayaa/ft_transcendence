import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db import models
from asgiref.sync import sync_to_async
from django.core.exceptions import ValidationError
from channels.db import database_sync_to_async
from apps.game.models.game import GameRoom
from apps.game.models.tournament import TournamentRoom
from django.db import transaction
from django.contrib.auth.models import User

@database_sync_to_async
def get_tournaments():
	tournaments = TournamentRoom.get_available_tournaments()

	return [tournament.get_tournament_data() for tournament in tournaments]

@database_sync_to_async
def get_game_rooms():
	rooms = GameRoom.get_available_rooms()

	return [room.get_room_status() for room in rooms]

class MatchmakingConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.channel_layer.group_add(
			"matchmaking",
			self.channel_name
		)
		await self.accept()

		# Get tournament data
		tournaments = await get_tournaments()

		rooms = await get_game_rooms()

		await self.send(json.dumps({
			'type': 'room_list',
			'rooms': rooms,
			'tournaments': tournaments,
		}))


	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			"matchmaking",
			self.channel_name,
		)
		if hasattr(self, 'queue_entry'):
			await database_sync_to_async(self.queue_entry.cancel_queue)()


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
		
