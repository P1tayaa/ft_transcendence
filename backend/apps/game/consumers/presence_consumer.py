from apps.game.consumers.consumers import BaseConsumer
from channels.db import database_sync_to_async
import json

class PresenceConsumer(BaseConsumer):
	async def connect(self):
		await super().connect()

		if not self.user:
			await self.close()
			return

		await self.accept()

		await self.update_online_status(True)

		await self.channel_layer.group_send(
			'presence', {
				'type': 'user_online',
				'data': {
					'user_id': self.user.id,
					'username': self.user.username
				}
			}
		)

		await self.channel_layer.group_add('presence', self.channel_name)

	async def disconnect(self, close_code):
		if not self.user:
			return

		await self.update_online_status(False)

		await self.channel_layer.group_discard('presence', self.channel_name)

		await self.channel_layer.group_send(
			'presence', {
				'type': 'user_offline',
				'data': {
					'user_id': self.user.id,
					'username': self.user.username
				}
			}
		)

	@database_sync_to_async
	def update_online_status(self, is_online):
		self.user.profile.online = is_online
		self.user.profile.save(update_fields=['online'])

	async def user_online(self, event):
		await self.send(json.dumps({
			'type': 'user_online',
			'data': event['data'],
		}))

	async def user_offline(self, event):
		await self.send(json.dumps({
			'type': 'user_offline',
			'data': event['data'],
		}))
