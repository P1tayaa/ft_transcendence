import json
from channels.generic.websocket import AsyncWebsocketConsumer

class BaseConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'room_{self.room_name}'
    
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

class GameConsumer(BaseConsumer):
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'paddle_move':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'paddle_move',
                    'player_id': self.scope['user'].id,
                    'position': data['position'],
                    'rotation': data['rotation'],
                }
            )
        elif message_type == 'chat_send':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_send',
                    'username': self.scope['user'].username,
                    'message': data['message']
                }
            )

    async def game_move(self, event):
        await self.send(text_data = json.dumps(event))

    async def chat_send(self, event):
        await self.send(text_data = json.dumps(event))

class SpectatorConsumer(BaseConsumer):
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        # can send chats
        if message_type == 'chat_send':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_send',
                    'username': self.scope['user'].username,
                    'message': data['message']
                }
            )

    async def watch(self, event):
        await self.send(text_data = json.dumps(event))

    async def chat_send(self, event):
        await self.send(text_data = json.dumps(event))
