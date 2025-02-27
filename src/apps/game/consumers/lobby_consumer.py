import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from apps.game.models.lobby import Lobby, LobbyPlayer


class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.lobby_id = self.scope['url_route']['kwargs']['lobby_id']
        self.lobby_group_name = f'lobby_{self.lobby_id}'

        await self.channel_layer.group_add(
            self.lobby_group_name,
            self.channel_name
        )
        
        await self.accept()

        lobby_state = await self.get_lobby_state(self.lobby_id)
        await self.send(text_data=json.dumps({
            'type': 'lobby_state',
            'lobby': lobby_state
        }))

    async def disconnect(self):
        await self.channel_layer.group_discard(
            self.lobby_group_name,
            self.channel_name
        )


    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', '')
        if message_type == 'ready_state':
            is_ready = data.get('is_ready', False)
            result = await self.set_player_ready(
                self.lobby_id, 
                self.user.id, 
                is_ready
            )
            await self.channel_layer.group_send(
                self.lobby_group_name,
                {
                    'type': 'player_ready_change',
                    'player': {
                        'id': self.user.id,
                        'username': self.user.username,
                        'is_ready': is_ready
                    },
                    'all_ready': result['all_ready']
                }
            )
