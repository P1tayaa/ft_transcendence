from django.db import models
from django.contrib.auth.models import User

class BaseGameRoom(models.Model):
    room_name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    player1 = models.ForeignKey(User, related_name='player1', null=True, on_delete=models.SET_NULL)
    player2 = models.ForeignKey(User, related_name='player2', null=True, on_delete=models.SET_NULL)
    score1 = models.IntegerField(default=0)
    score2 = models.IntegerField(default=0)
