from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import transaction
import logging
from apps.game.models.game import GameRoom, GameResult
import uuid
import random

logger = logging.getLogger(__name__)

class Tournament(models.Model):
	"""
	Represents a tournament with multiple games
	"""
	name = models.CharField(max_length=100, unique=True)
	created_at = models.DateTimeField(auto_now_add=True)

	# Tournament settings
	player_count = models.IntegerField(default=4)  # Will always be 4
	map = models.CharField(max_length=20, default='classic')

	STATUS_CHOICES = (
		('waiting', 'Waiting for Players'),
		('in_progress', 'In Progress'),
		('completed', 'Completed'),
	)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')

	# The player who created the tournament
	creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tournaments')

	# Winner of the tournament
	winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tournament_wins')

	@classmethod
	def create(cls, name, creator, map='classic'):
		"""
		Class method to create a tournament with empty bracket structure
		"""
		with transaction.atomic():
			# Create the tournament with fixed player_count=4
			tournament = cls.objects.create(
				name=name,
				creator=creator,
				player_count=4,
				map=map,
				status='waiting'
			)

			# Create empty bracket structure for 4 players (2 semifinals, 1 final)
			TournamentMatch.objects.create(
				tournament=tournament,
				round=1,
				match_number=1
			)

			TournamentMatch.objects.create(
				tournament=tournament,
				round=1,
				match_number=2
			)

			TournamentMatch.objects.create(
				tournament=tournament,
				round=2,
				match_number=1
			)

			return tournament

	def join(self, user):
		"""Player joins the tournament"""
		with transaction.atomic():
			# Check if tournament is joinable
			if self.status != 'waiting':
				raise ValidationError("Tournament has already started")

			# Check if player is already in the tournament
			if self.players.filter(user=user).exists():
				player = self.players.get(user=user)
				return {
					'id': user.id,
					'username': user.username
				}

			# Check if tournament is full (always 4 players)
			if self.players.count() >= 4:
				raise ValidationError("Tournament is full")

			# Create tournament player
			player = TournamentPlayer.objects.create(
				tournament=self,
				user=user
			)

			# Assign player to an available match slot
			self.assign_player_to_match(player)

			return {
				'id': player.user.id,
				'username': player.user.username
			}

	def assign_player_to_match(self, player):
		"""Assign a player to the first available match slot"""
		# Get first round matches
		matches = self.matches.filter(round=1).order_by('match_number')

		for match in matches:
			# Assign to player1 slot if empty
			if match.player1 is None:
				match.player1 = player
				match.save()
				return
			# Assign to player2 slot if empty
			elif match.player2 is None:
				match.player2 = player
				match.save()
				return

	def leave(self, user):
		"""Player leaves the tournament"""
		with transaction.atomic():
			try:
				player = self.players.filter(user=user).first()
				if not player:
					raise ValidationError("Player not in this tournament")

				# Only allow leaving if tournament hasn't started
				if self.status != 'waiting':
					raise ValidationError("Cannot leave tournament in progress")

				# Remove player from any match slots
				for match in self.matches.all():
					if match.player1 == player:
						match.player1 = None
						match.save()
					if match.player2 == player:
						match.player2 = None
						match.save()

				player.delete()

				return True
			except Exception as e:
				logger.error(f"Error leaving tournament: {e}")
				return False

	def start(self):
		"""Start the tournament and create game rooms for first round"""
		if self.status != 'waiting':
			return False

		with transaction.atomic():
			# Ensure we have exactly 4 players
			if self.players.count() != 4:
				return False

			# Set tournament to in_progress
			self.status = 'in_progress'
			self.save()

			# Create game rooms for first round matches
			self.create_games(1)

			return True

	def create_games(self, round_number):
		"""Create game rooms for a specific round"""
		matches = self.matches.filter(round=round_number, game_room__isnull=True)

		for match in matches:
			# Skip matches without both players assigned yet
			if not match.player1 or not match.player2:
				continue

			# Create a game room for this match
			game_name = f"tournament_{self.id}_r{round_number}_m{match.match_number}"
			game_room = GameRoom.objects.create(
				name=game_name,
				map=self.map,
				player_count=2,
				tournament=self,
				status='waiting'
			)

			# Update match with game room
			match.game_room = game_room
			match.save()

	def game_completed(self, game_room, game_result):
		"""Handle a tournament game completion"""
		try:
			match = self.matches.get(game_room=game_room)
			winner = game_result.winner

			if not winner:
				logger.error("Game completed without a winner")
				return

			# Record winner in the match
			match.winner_id = winner.id
			match.save()

			# If this was a semifinals match, update finals
			if match.round == 1:
				# Find the next match in the tournament
				finals_match = self.matches.get(round=2, match_number=1)

				# Assign the winner to the appropriate position
				if match.match_number == 1:
					winner_player = self.players.get(user=winner)
					finals_match.player1 = winner_player
				else:  # match 2
					winner_player = self.players.get(user=winner)
					finals_match.player2 = winner_player

				finals_match.save()

				# If both finalists are set, create the finals game
				if finals_match.player1 and finals_match.player2:
					self.create_games(2)

			# If this was the finals match, end tournament
			if match.round == 2:
				self.winner = winner
				self.status = 'completed'
				self.save()

			return True

		except Exception as e:
			logger.error(f"Error processing game completion in tournament: {e}")
			return False

	def get_status(self):
		"""Get tournament status including players and matches"""
		matches = []
		for match in self.matches.all():
			match_data = {
				'id': match.id,
				'round': match.round,
				'match_number': match.match_number,
				'game_room': match.game_room.name if match.game_room else None,
				'player1': None,
				'player2': None,
				'winner': None
			}

			if match.player1:
				match_data['player1'] = {
					'id': match.player1.user.id,
					'username': match.player1.user.username
				}

			if match.player2:
				match_data['player2'] = {
					'id': match.player2.user.id,
					'username': match.player2.user.username
				}

			if match.winner_id:
				winner = User.objects.get(id=match.winner_id)
				match_data['winner'] = {
					'id': winner.id,
					'username': winner.username
				}

			matches.append(match_data)

		return {
			'id': self.id,
			'name': self.name,
			'status': self.status,
			'map': self.map,
			'max_players': self.player_count,
			'players': [
				{
					'id': player.user.id,
					'username': player.user.username
				} for player in self.players.all()
			],
			'matches': matches,
			'winner': {
				'id': self.winner.id,
				'username': self.winner.username
			} if self.winner else None
		}

class TournamentPlayer(models.Model):
	"""Player in a tournament"""
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='players')
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tournaments')

	class Meta:
		unique_together = ['tournament', 'user']

class TournamentMatch(models.Model):
	"""Represents a match in a tournament bracket"""
	tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
	round = models.IntegerField()  # 1 = semifinal, 2 = final
	match_number = models.IntegerField()  # Which match in the round
	player1 = models.ForeignKey(TournamentPlayer, on_delete=models.SET_NULL,
							   null=True, blank=True, related_name='matches_as_player1')
	player2 = models.ForeignKey(TournamentPlayer, on_delete=models.SET_NULL,
							   null=True, blank=True, related_name='matches_as_player2')
	winner_id = models.IntegerField(null=True, blank=True)  # User ID of the winner
	game_room = models.OneToOneField(GameRoom, on_delete=models.SET_NULL,
									null=True, blank=True, related_name='tournament_match')

	class Meta:
		unique_together = [
			['tournament', 'round', 'match_number']
		]
