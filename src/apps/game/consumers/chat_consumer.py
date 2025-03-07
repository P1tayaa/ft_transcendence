from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
import asyncio
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User
from apps.users.models import Chat, Message



class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close()
            return
        
        self.user = user
        self.user_group = f"user_{user.id}"

        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()


    async def disconnect(self, close_code):
        if hasattr(self, "user_group"):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)


    async def new_message(self, event):
        chat_id = event.get("chat", {}).get("id")
        
        if chat_id:
            def get_user_in_chat():
                return Chat.objects.filter(
                    id=chat_id,
                    participants=self.user
            ).exists()

            is_participant = await sync_to_async(get_user_in_chat)()
            if is_participant:
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

