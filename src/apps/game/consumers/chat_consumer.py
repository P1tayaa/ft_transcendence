from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from apps.users.models import Chat, Message

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close()
            return

        self.user_group = f"user_{user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()


    async def disconnect(self):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)


    async def new_message(self, event):
        await self.send_json({
             "type": "new_message",
             "message": event["message"],
             "chat": event["chat"]
         })


    async def typing_status(self, event):
        await self.send_json({
                 "type": "typing_status",
                 "user": event["user"],
                 "chat_id": event["chat_id"],
                 "is_typing": event["is_typing"]
             })
