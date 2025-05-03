from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

def user_profile_path(instance, filename):
	ext = filename.split('.')[-1]
	return f'avatars/user_{instance.user.id}/avatar.{ext}'


class Profile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE)
	avatar = models.ImageField(
		upload_to=user_profile_path,
		null=True,
		blank=True,
	)

	def get_avatar(self):
		if self.avatar:
			return self.avatar.url
		return None

	def follow_user(self, profile):
		return Follow.objects.create(follower=self, followed=profile)

	def unfollow_user(self, profile):
		return self.following.filter(followed=profile).delete()

	def is_following(self, profile):
		return self.following.filter(followed=profile).exists()

	def get_following(self):
		return self.following.all()

	def get_followers(self):
		return self.followers.all()

	def block_user(self, profile):
		return Block.objects.create(blocker=self, blocked=profile)

	def unblock_user(self, profile):
		return self.blocking.filter(blocked=profile).delete()

	def is_blocking(self, profile):
		return self.blocking.filter(blocked=profile).exists()

	def get_blocking(self):
		return self.blocking.all()

	def get_scores(self):
		return self.scores.all()

	def get_or_create_chat_with(self, other_user):
		common_chats = Chat.objects.filter(
			participants=self.user
		).filter(
			participants=other_user
		)

		if common_chats.exists():
			return common_chats.first()

		new_chat = Chat.objects.create()
		new_chat.participants.add(self.user, other_user)
		new_chat.save()

		return new_chat

	def get_chat_history(self, chat_id):
		try:
			chat = Chat.objects.get(id=chat_id, participants=self.user)
			total_messages = chat.messages.count()
			messages = chat.messages.all().order_by("timestamp")

			return {
				"chat_id": chat.id,
				"participants": list(
					chat.participants.values("id", "username")
				),
				"messages": [
					{
						"id": msg.id,
						"type": msg.type,
						"content": msg.content,
						"sender": msg.sender.username,
						"sender_id": msg.sender.id,
						"timestamp": msg.timestamp,
						"is_read": msg.is_read,
					}
					for msg in messages
				],
				"total_messages": total_messages,
			}
		except Chat.DoesNotExist:
			return None
		
	def get_match_history(self):
		scores = self.user.game_results.all().select_related('game').order_by('-game__date')
		return {
			"total": scores.count(),
			"wins": scores.filter(is_winner='True').count(),
			"losses": scores.filter(is_winner='False').count(),
			"results": [score.game.get_results() for score in scores],
		}


class Follow(models.Model):
	follower = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="following")
	followed = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="followers")
	created_at = models.DateTimeField(auto_now_add=True)
	class Meta:
		unique_together = ["follower", "followed"]

class Block(models.Model):
	blocker = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="blocking")
	blocked = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="blocked")
	blocked_at = models.DateTimeField(auto_now_add=True)
	class Meta:
		unique_together = ["blocker", "blocked"]


class Chat(models.Model):
	participants = models.ManyToManyField(User, related_name="chats")
	sent_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["sent_at"]


class Message(models.Model):
	chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
	sender = models.ForeignKey(
		User, on_delete=models.CASCADE, related_name="sent_messages"
	)
	content = models.TextField(default="")
	timestamp = models.DateTimeField(auto_now_add=True)
	is_read = models.BooleanField(default=False)
	type = models.CharField(max_length=20, default='text')

	class Meta:
		ordering = ["timestamp"]
