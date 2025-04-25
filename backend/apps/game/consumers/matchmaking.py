import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from apps.game.models.game import GameRoom

@database_sync_to_async
def get_game_rooms():
	rooms = GameRoom.objects.filter(is_active=True, status='waiting')

	return [room.get_status() for room in rooms]

class MatchmakingConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.channel_layer.group_add(
			"matchmaking",
			self.channel_name
		)
		await self.accept()

		# Get tournament data
		rooms = await get_game_rooms()

		await self.send(json.dumps({
			'type': 'room_list',
			'rooms': rooms,
		}))


	async def disconnect(self, close_code):
		await self.channel_layer.group_discard(
			"matchmaking",
			self.channel_name,
		)

	async def room_created(self, event):
		await self.send(json.dumps({
			'type': 'room_created',
			'room': event['room'],
		}))
