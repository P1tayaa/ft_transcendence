from django.db import models
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import transaction
import random
from .game import GameRoom, GameConfig

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
	config = models.ForeignKey(GameConfig, related_name='tournaments', on_delete=models.PROTECT)


	def get_current_matches(self):
		return self.tournament_matches.filter(status='IN_PROGRESS')


	def get_completed_matches(self):
		return self.tournament_matches.filter(status='COMPLETED')


	def get_standings(self):
		return self.participant_scores.all().order_by('-wins', '-points')        


	@classmethod
	def get_available_tournaments(cls):
		with transaction.atomic():
			return cls.objects.select_related('config').filter(is_active=True, status='WAITING')


	def join_tournament(self, player):
		# allow to join if not started and not full
		if self.status != 'WAITING':
			raise ValidationError("Tournament is not available to join")

		if self.participants.count() >= self.max_participants:
			raise ValidationError("Tournament is full")
		participant, _ = TournamentParticipant.objects.get_or_create(
			tournament=self,
			player=player,
			is_active=True,
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
		self.broadcast_tournament_update()

		participant_count = self.participants.all().count()
		# auto start when full
		if participant_count == self.max_participants:
			self.start_tournament()

		return participant


	def leave_tournament(self, player):
		try:
			participant = TournamentParticipant.objects.get(tournament=self, player=player)
			if self.status == "WAITING":
				TournamentScore.objects.filter(tournament=self, player=player).delete()
				participant.delete()
				self.broadcast_tournament_update()
				return True

			elif self.status == "IN_PROGRESS":
				participant.is_active = False
				participant.eliminated = True
				participant.save()

				active_matches = TournamentMatch.objects.filter(tournament=self, player_states__player=player, status="IN_PROGRESS")
				for match in active_matches:
					match.players.remove(player)
					opponent_state = match.player_states.exclude(player=player).first()
					if opponent_state:
						scores = {
							str(opponent_state.player.id): 1,
							str(player.id): 0
						}
						match.complete_game(opponent_state.player.id, scores)

				self.broadcast_tournament_update()
				return True
			else:
				raise ValidationError("Cannot leave completed tournament!")
		except TournamentParticipant.DoesNotExist:
			raise ValidationError("Participant not found")


	def start_tournament(self):
		if self.status != 'WAITING':
			raise ValidationError("Tournament has already started")

		with transaction.atomic():
			participants = list(self.participants.all())
			if len(participants) < 2:
				raise ValidationError("Not enough participants to start tournament")

			random.shuffle(participants)

			self.create_round_matches(
				round_number=1,
				players = [p.player for p in participants]
			)
			self.status = 'IN_PROGRESS'
			self.save()
			self.broadcast_tournament_update()


	def create_round_matches(self, round_number, players):
		for i in range(0, len(players), 2):
			if i + 1 < len(players):
				match_config = GameConfig.objects.create(
					mode = self.config.mode,
					powerups_enabled = self.config.powerups_enabled,
					player_count = 2,
					map_style = self.config.map_style,
					player_sides = ['left', 'right']
				)

				match = TournamentMatch.objects.create(
					tournament = self,
					round_number = round_number,
					match_number = i / 2,
					room_name = f"{self.tournament_name}_R{round_number}M{i/2}",
					config =match_config,
					is_tournament_game = True
				)

				match.join_game(players[i])
				match.join_game(players[i + 1])


	def process_completed_match(self, match):
		with transaction.atomic():
			winner = match.get_winner()
			loser = match.player_states.exclude(player=winner).first().player

			winner_score = TournamentScore.objects.get(tournament=self, player=winner)
			loser_score = TournamentScore.objects.get(tournament=self, player=loser)

			winner_score.matches_played += 1
			winner_score.wins += 1
			winner_score.points += match.get_player_score(winner)
			winner_score.save()

			loser_score.matches_played += 1
			loser_score.losses += 1
			loser_score.points += match.get_player_score(loser)
			loser_score.save()

			TournamentParticipant.objects.filter(
				tournament=self,
				player=loser
			).update(eliminated=True)

			current_round = match.round_number
			matches_in_round = self.tournament_matches.filter(round_number=current_round)
			all_completed = all(m.status == 'COMPLETED' for m in matches_in_round)

			if all_completed:
				round_winners = [m.get_winner() for m in matches_in_round]
				if len(round_winners) == 1:
					self.status = 'COMPLETED'
					self.save()
				else:
					self.create_round_matches(round_number=current_round + 1, players=round_winners)
			self.broadcast_tournament_update()


	def get_tournament_data(self):
		return {
			'id': self.id,
			'name': self.tournament_name,
			'status': self.status,
			'creator': self.creator.username,
			'participants_count': self.participants.all().count(),
			'participants_max': self.max_participants,
			'participants': [{
					'id': p.player.id,
					'username': p.player.username,
					'eliminated': p.eliminated,
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
			} for s in self.get_standings()]
		}


	def broadcast_tournament_update(self):
		channel_layer = get_channel_layer()

		# Send the data to all connected clients
		async_to_sync(channel_layer.group_send)(
			'tournament',
			{
				'type': 'tournament_update',
				'tournament_data': self.get_tournament_data()
			}
		)



class TournamentParticipant(models.Model):
	tournament = models.ForeignKey(TournamentRoom, related_name='participants', on_delete=models.CASCADE)
	player = models.ForeignKey(User, related_name='tournament_participant', on_delete=models.CASCADE)
	joined_at = models.DateTimeField(auto_now_add=True)
	is_active = models.BooleanField(default=True)
	eliminated = models.BooleanField(default=False)

	class Meta:
		unique_together = ['tournament', 'player']



class TournamentMatch(GameRoom):
	MATCH_STATUS = (
		('SCHEDULED', 'Scheduled'),
		('IN_PROGRESS', 'In Progress'),
		('COMPLETED', 'Completed')
	)

	tournament = models.ForeignKey(TournamentRoom, related_name='tournament_matches', on_delete=models.CASCADE)
	round_number = models.IntegerField(default=0)
	match_number = models.IntegerField(default=0)

	class Meta:
		unique_together = ['tournament', 'round_number', 'match_number']


	def get_winner(self):
		if self.status != 'COMPLETED':
			return None

		player_states = list(self.player_states.all())
		if player_states[0].score >player_states[1].score:
			return player_states[0].player
		return player_states[1].player


	def get_player_score(self, player):
		return self.player_states.get(player=player).score


	def complete_game(self, winner_id, scores):
		super().complete_game(winner_id, scores)
		self.tournament.process_completed_match(self)


	def join_game(self, player):
		result = super().join_game(player)
		if self.players.count() == 2:
			self.status = 'IN_PROGRESS'
			self.save()
		return result



class TournamentScore(models.Model):
	tournament = models.ForeignKey(TournamentRoom, related_name='participant_scores', on_delete=models.CASCADE)
	player = models.ForeignKey(User, related_name='tournament_scores', on_delete=models.CASCADE)
	matches_played = models.IntegerField(default=0)
	wins = models.IntegerField(default=0)
	losses = models.IntegerField(default=0)
	points = models.IntegerField(default=0)

	class Meta:
		unique_together = ['tournament', 'player']
