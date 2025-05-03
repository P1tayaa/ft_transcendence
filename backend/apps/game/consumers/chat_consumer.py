from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from apps.users.models import Chat


# Currently no authentication
class ChatConsumer(AsyncJsonWebsocketConsumer):
	async def connect(self):
		self.chat_id = self.scope["url_route"]["kwargs"]["chat_id"]
		if not self.chat_id:
			await self.error("Chat ID is required")
			return

		self.chat = None 
		self.chat = await self.get_chat()
		if not self.chat:
			self.error("Chat not found")
			return

		self.chat_group = f"chat_{self.chat_id}"

		# Join the chat group
		await self.channel_layer.group_add(self.chat_group, self.channel_name)
		await self.accept()


	async def disconnect(self, close_code = None):
		if hasattr(self, "chat_group"):
			await self.channel_layer.group_discard(self.chat_group, self.channel_name)


	@database_sync_to_async
	def get_chat(self):
		if self.chat is not None:
			return self.chat

		try:
			return Chat.objects.filter(id=self.chat_id).first()
		except Chat.DoesNotExist:
			return None


	async def new_message(self, event):
		await self.send_json({
			"type": "new_message",
			"message": event["message"],
			"chat": event["chat"]
		})

	async def error(self, message):
		await self.send_json({
			"type": "error",
			"message": message
		})
		self.close()
