from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

def user_profile_path(instance, filename):
    ext = filename.split('.')[-1]
    return f'profile_pics/user_{instance.user.id}/profile_pic.{ext}'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    highscore = models.IntegerField(default=0)
    most_recent_game_score = models.IntegerField(default=0)
    profile_picture = models.ImageField(
        upload_to=user_profile_path,
        null=True,
        blank=True,
    )

    def get_profile_picture_url(self):
        if self.profile_picture:
            return self.profile_picture.url
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

    def get_all_chats(self):
        # get all chats with latest message
        chats = self.user.chats.all()
        chat_data = []

        for chat in chats:
            latest_message = chat.messages.last()
            other_participant = chat.participants.exclude(id=self.user.id)
            chat_data.append(
                {
                    "chat_id": chat.id,
                    "participants": list(other_participant.values("id", "username")),
                    "latest_message": {
                        "content": latest_message.content if latest_message else None,
                        "timestamp": latest_message.timestamp
                        if latest_message
                        else None,
                        "sender": latest_message.sender.username
                        if latest_message
                        else None,
                    },
                    "unread_count": chat.messages.filter(is_read=False)
                    .exclude(sender=self.user)
                    .count(),
                }
            )
            # return chat_data
        return chat_data        

    def get_chat_history(self, chat_id):
        try:
            chat = Chat.objects.get(id=chat_id, participants=self.user)
            total_messages = chat.messages.count()
            messages = chat.messages.all().order_by("timestamp")

            return {
                "chat_id": chat.id,
                "participants": list(
                    chat.participants.exclude(id=self.user.id).values("id", "username")
                ),
                "messages": [
                    {
                        "id": msg.id,
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

    def mark_messages_read(self, chat_id):
        chat = Chat.objects.get(id=chat_id, participants=self.user)
        return (
            chat.messages.filter(is_read=False)
            .exclude(sender=self.user)
            .update(is_read=True)
        )


class Game(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    winner = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, related_name='games_won')

    class Meta:
        ordering = ["-date"]

    @property
    def player_count(self):
        return self.player_scores.count()

    @classmethod
    def save_game_result(cls, game_state, winner_id):
        game = cls.objects.create(winner_id=winner_id)
        for player_id, player_data in game_state['players'].items():
            PlayerScore.objects.create(
                game=game,
                profile_id=player_id,
                score=game_state['score'][player_id],
                position=player_data['position']
            )
        return game


class PlayerScore(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="player_scores")
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="scores")
    score = models.IntegerField(default=0)
    position = models.CharField(max_length=20)

    class Meta:
        ordering = ["-game__date"]
        unique_together = ['game', 'profile']


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

    class Meta:
        ordering = ["timestamp"]
