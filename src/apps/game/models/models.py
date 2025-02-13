from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import transaction
import math
import random


class BaseGameRoom(models.Model):
    room_name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    player1 = models.ForeignKey(User, related_name='player1', null=True, on_delete=models.SET_NULL)
    player2 = models.ForeignKey(User, related_name='player2', null=True, on_delete=models.SET_NULL)
    score1 = models.IntegerField(default=0)
    score2 = models.IntegerField(default=0)

    class Meta:
        abstract = True

class TournamentRoom(models.Model):
    TOURNAMENT_STATUS = (
        ('WAITING', 'Waiting for players'),
        ('IN_PROGRESS', 'Tournament in Progress'),
        ('COMPLETED', 'Tournament Completed')
    )

    tournament_name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices = TOURNAMENT_STATUS, default = 'WAITING')
    max_participants = models.IntegerField(default=8)
    creator = models.ForeignKey(User, related_name='created_tournament', on_delete=models.SET_NULL, null=True)

    def get_current_matches(self):
        return self.tournament_matches.filter(status='IN_PROGRESS')

    def get_completed_matches(self):
        return self.tournament_matches.filter(status='COMPLETED')

    def get_standings(self):
        return self.participant_scores.all().order_by('-wins', '-points')

    def join_tournament(self, player):
        # allow to join if not started and not full
        if self.status != 'WAITING':
            raise ValidationError("Tournament is full")

        current_participants = self.participants.count()
        if current_participants >= self.max_participants:
            raise ValidationError("Tournament is full")

        participant, created =TournamentParticipant.objects.get_or_create(
            tournament=self,
            player=player,
            defaults={'is_active': True}
        )

        TournamentScore.objects.get_or_create(
            tournament=self,
            player=player,
            defaults={
                'matches_played': 0,
                'wins': 0,
                'losses': 0,
                'points': 0
            }
        )

        if self.participants.count() == self.max_participants:
            self.start_tournament()

        return participant

    def start_tournament(self):
        if self.status != 'WAITING':
            raise ValidationError("Tournament has already started")

        with transaction.atomic():
            participants = list(self.participants.filter(is_active=True))
            if len(participants) < 2:
                raise ValidationError("Not enough participants to start tournament")

            random.shuffle(participants)

            round_number = 1
            for i in range(0, len(participants), 2):
                if i + 1 < len(participants):
                    TournamentMatch.objects.create(
                        tournament=self,
                        round_number =round_number,
                        match_number = i//2,
                        player1 = participants[i].player,
                        player2 = participants[i + 1].player,
                        room_name = f"{self.tournament_name}_R{round_number}M{i//2}",
                        status='SCHEDULED',
                    )

            self.status = 'IN_PROGRESS'
            self.save()


    def complete_match(self, match, winner):
        with transaction.atomic():
            match.status = 'COMPLETED'
            match.winner = winner
            match.save()

            loser = match.player2 if winner == match.player1 else match.player1
            winner_score = TournamentScore.objects.get(tournament=self, player=winner)
            loser_score = TournamentScore.objects.get(tournament=self, player=loser)

            winner_score.matches_played += 1
            winner_score.wins += 1
            winner_score.points += match.score1 if winner == match.player1 else match.score2
            winner_score.save()

            loser_score.matches_player += 1
            loser_score.losses += 1
            loser_score.points += match.score2 if winner == match.player1 else match.score1
            loser_score.save()

            TournamentParticipant.objects.filter(
                tournament=self,
                player=loser
            ).update(eliminated=True)

            current_round = match.round_number
            matches_in_round = self.tournament_matches.filter(round_number=current_round)
            all_completed = all(m.status == 'COMPLETED' for m in matches_in_round)

            if all_completed:
                winners = [m.winner for m in matches_in_round]
                if len(winners) == 1:
                    self.status = 'COMPLETED'
                    self.save()
                else:
                    # create next round
                    next_round = current_round + 1
                    for i in range(0, len(winners), 2):
                        if i + 1 < len(winners):
                            TournamentMatch.objects.create(
                                tournament=self,
                                round_number=next_round,
                                match_number = i//2,
                                player1 = winners[i],
                                player2 = winners[i + 1],
                                room_name = f"{self.tournament_name}_R{next_round}M{i//2}",
                                status='SCHEDULED'
                            )

    def get_tournament_status(self):
        return {
            'status': self.status,
            'participants': [{
                    'id': p.player.id,
                    'username': p.player.username,
                    'eliminated': p.player.eliminated,
            } for p in self.participants.all()],
            'current_matches': [{
                'match_id': m.id,
                'room_name': m.room_name,
                'player1': m.player1.username if m.player1 else 'TBD',
                'player2': m.player2.username if m.player2 else 'TBD',
                'score1': m.score1,
                'score2': m.score2,
                'status': m.status,
            } for m in self.get_current_matches()],
            'standings': [{
                'player': s.player.username,
                'matches_played': s.matches_played,
                'wins': s.wins,
                'losses': s.losses,
                'points': s.points,
            }for s in self.get_standings()]
        }


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(TournamentRoom, related_name='participants', on_delete=models.CASCADE)
    player = models.ForeignKey(User, related_name='tournament_participant', on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    eliminated = models.BooleanField(default=False)

    class Meta:
        unique_together = ['tournament', 'player']


class TournamentMatch(BaseGameRoom):
    MATCH_STATUS = (
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed')
    )

    tournament = models.ForeignKey(TournamentRoom, related_name='tournament_matches', on_delete=models.CASCADE)
    round_number = models.IntegerField(default=0)
    match_number = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=MATCH_STATUS, default='SCHEDULED')
    winner = models.ForeignKey(User, related_name='tournament_wins', null=True, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['tournament', 'round_number', 'match_number']

class TournamentScore(models.Model):
    tournament = models.ForeignKey(TournamentRoom, related_name='participant_scores', on_delete=models.CASCADE)
    player = models.ForeignKey(User, related_name='tournament_scores', on_delete=models.CASCADE)
    matches_played = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    points = models.IntegerField(default=0)

    class Meta:
        unique_together = ['tournament', 'player']
