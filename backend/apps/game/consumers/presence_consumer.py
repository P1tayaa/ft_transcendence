from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
from django.contrib.auth.models import User

class PresenceConsumer(AsyncWebsocketConsumer):
    online_users = set()

    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close()
            return

        PresenceConsumer.online_users.add(user.id)
        # join presence group
        await self.channel_layer.group_add('presence', self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(
                'presence',
                {
                    'type': 'user_online',
                    'user_id': user.id,
                    'username': user.username
                }
            )

        # send current online users to new connected user
        await self.send(json.dumps({
               'type': 'online_users',
               'users': [await self.get_user_info(user_id) for user_id in PresenceConsumer.online_users]
           }))


    async def disconnect(self, close_code):
        user = self.scope['user']
        if user.is_authenticated:
            PresenceConsumer.online_users.discard(user.id)
            # leave presence group
            await self.channel_layer.group_discard('presence', self.channel_name)
            await self.channel_layer.group_send(
                'presence',
                {
                    'type': 'user_offline',
                    'user_id': user.id,
                    'username': user.username
                }
            )

        
    @database_sync_to_async
    def get_user_info(self, user_id):
        try:
            user = User.objects.get(id=user_id)
            return {
                'user_id': user.id,
                'username': user.username
            }
        except User.DoesNotExist:
            return None

    async def user_online(self, event):
        await self.send(json.dumps({
               'type': 'user_online',
               'user_id': event['user_id'],
               'username': event['username']
           }))

    async def user_offline(self, event):
        await self.send(json.dumps({
               'type': 'user_offline',
               'user_id': event['user_id'],
               'username': event['username']
           }))
