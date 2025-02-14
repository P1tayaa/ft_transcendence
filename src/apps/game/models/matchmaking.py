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
            rooms = await database_sync_to_async(list)(GameRoom.get_available_rooms().values('room_name', 'config__player_count'))
            await self.send(json.dumps({
                   'type': 'room_list',
                   'rooms': rooms
               }))
        elif message_type == 'find_random':
            try:
                game_room = await database_sync_to_async(MatchmakingQueue.find_random_match)(self.scope['user'])
                if game_room:
                    await self.send(json.dumps({
                           'type': 'match_found',
                           'room_name': game_room.room_name
                       }))
                else:
                    await self.send(json.dumps({
                           'type': 'queued',
                           'message': 'Waiting for games...'
                       }))
            except ValidationError as e:
                await self.send(json.dumps({
                       'type': 'error',
                       'message': str(e)
                   }))
        elif message_type == 'cancel_queue':
            if hasattr(self, 'queue_entry'):
                await database_sync_to_async(self.queue_entry.cancel_queue())()
                await self.send(json.dumps({
                       'type': 'queue_cancelled'
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
