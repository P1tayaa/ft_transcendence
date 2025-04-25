from django.db import models
from django.contrib.auth.models import User
from apps.game.models.game import Room


class Tournament(Room):
    name = models.CharField(max_length=100, unique=True)


class TournamentPlayer(models.Model):
    """
    Player registered for a tournament
    """
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='players')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    is_ready = models.BooleanField(default=False)

    class Meta:
        unique_together = ['tournament', 'user']