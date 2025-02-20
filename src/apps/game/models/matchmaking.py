import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db import models
from django.core.exceptions import ValidationError
from channels.db import database_sync_to_async
from apps.game.models.game import GameRoom
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
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'queue_entry'):
            await database_sync_to_async(self.queue_entry.cancel_queue)()

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'list_rooms':
            rooms = await database_sync_to_async(list)(
            GameRoom.get_available_rooms(self).values(
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
                )
            )
            formatted_rooms = [{
            'room_name': room['room_name'],
            'config': {
                'mode': room['config__mode'],
                'playerCount': room['config__player_count'],
                'map_style': room['config__map_style'],
                'powerup': str(room['config__powerups_enabled']),
                'poweruplist': room['config__powerup_list'],
                'playerside': room['config__player_sides'],
                'bots': str(room['config__bots_enabled']),
                'botsSide': room['config__bot_sides'],
                'host': str(room['config__is_host']),
                'Spectator': str(room['config__spectator_enabled'])
                }
            } for room in rooms]
            await self.send(json.dumps({
                   'type': 'room_list',
                   'rooms': formatted_rooms
               }))
# frontend usage
# // List available rooms
# matchmakingSocket.send(JSON.stringify({
#     type: 'list_rooms'
# }));

# // Or find random match
# matchmakingSocket.send(JSON.stringify({
#     type: 'find_random'
# }));

# matchmakingSocket.onmessage = (e) => {
#     const data = JSON.parse(e.data);
#     if (data.type === 'room_list') {
#         // Show list of rooms to join
#         console.log('Available rooms:', data.rooms);
#     } else if (data.type === 'match_found') {
#         // Join the game room
#         window.location.href = `/game/${data.room_name}`;
#     }
# };
