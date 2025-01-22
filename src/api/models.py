from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    highscore = models.IntegerField(default=0)
    most_recent_game_score = models.InterField(default=0)

    def add_friend(self, friend_user):
        return Friendship.objects.create(profile=self, friend=friend_user)
    def remove_friend(self, friend_user):
        return self.friendships.filter(friend=friend_user).delete()
    def is_friend(self, friend_user):
        return self.friendships.filter(friend=friend_user).exists()
    def get_friends(self):
        return self.friendships.all()

    def get_scores(self):
        return self.scores.all()

    def get_chat_with(self, other_user):
        # get or create chat with other_user
        common_chats = self.user.chats.filter(participants=other_user)
        if common_chats.exists():
            return common_chats.first()
        else:
            new_chat = Chat.objects.create()
            new_chat.participants.add(self.user, other_user)
            return new_chat
    def get_all_chats(self):
        # get all chats with latest message
        chats = self.user.chats.all()
        chat_data = []        

        for chat in chats:
            latest_message = chat.messages.last()
            other_participant = chat.participants.exclude(id=self.user.id)
            chat_data.append({
                 'chat_id': chat.id,
                 'participants': list(other_participant.values('id', 'username')),
                 'latest_message': {
                     'content': latest_message.content if latest_message else None,
                     'timestamp': latest_message.timestamp if latest_message else None,
                     'sender': latest_message.sender.username if latest_message else None,
                 },
                 'unread_count': chat.messages.filter(is_read=False).exclude(sender=self.user).count()
             })
            return chat_data
    def get_chat_history(self, chat_id, limit=50, offset=0):
        try:
            chat = Chat.objects.get(id=chat_id, participants=self.user)
            messages = chat.messages.all().order_by('-timestamp')[offset:offset + limit]

            return {
                'chat_id': chat.id,
                'participants': list(chat.participants.exclude(id=self.user.id).values('id', 'username')),
                'messages':[{
                    'id': msg.id,
                    'content': msg.content,
                    'sender': msg.sender.username,
                    'timestamp': msg.timestamp,
                    'is_read': msg.is_read
                } for msg in messages ],
                'has_more': chat.messages.count() > (offset + limit)
            }
        except Chat.DoesNotExist:
            return None
    def mark_messages_read(self, chat_id):
        chat = Chat.objects.get(id=chat_id, participants=self.user)
        return chat.messages.filter(is_read=False).exclude(sender=self.user).update(is_read=True)





class ScoreHistory(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='scores')
    score = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-date']

class Friendship(models.Model):
    # friend invite initiator
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='friendships')
    # the friend
    friend = models.ForeignKey(Profile, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # can't be friends with same person twice
        unique_together = ['profile', 'friend']



class Chat(models.Model):
    participants = models.ManyToManyField(User, related_name='chats')
    sent_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sent_at']

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_names='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']
