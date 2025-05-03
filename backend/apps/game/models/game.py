from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


class Room(models.Model):
	"""
	Abstract base class for all room types (game rooms, tournament rooms)
	"""
	name = models.CharField(max_length=100, unique=True)
	created_at = models.DateTimeField(auto_now_add=True)

	MAPS = (
		('classic', 'Classic'),
		('bath', 'Bath'),
		('lava', 'Lava'),
		('beach', 'Beach'),
	)

	map = models.CharField(max_length=20, choices=MAPS, default='classic')
	player_count = models.IntegerField(validators=[MinValueValidator(2), MaxValueValidator(4)], default=2)

	STATUS_CHOICES = (
		('waiting', 'Waiting for Players'),
		('in_progress', 'In Progress'),
	)

	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='waiting')

	class Meta:
		abstract = True


class GameRoom(Room):
	"""
	Represents an active game room where players join to play
	"""
	# If this game is part of a tournament
	tournament = models.ForeignKey('Tournament', on_delete=models.SET_NULL,
								  null=True, blank=True, related_name='tournament_games')

	# Game room is automatically closed when completed
	is_active = models.BooleanField(default=True)

	# Layout information - which player is on which side
	SIDES = (
		('left', 'Left'),
		('right', 'Right'),
		('top', 'Top'),
		('bottom', 'Bottom'),
	)

	def get_status(self):
		"""Get full room status including players"""
		return {
			'id': self.id,
			'name': self.name,
			'status': self.status,
			'map': self.map,
			'player_count': self.player_count,
			'players': [
				{
					'id': player.user.id,
					'username': player.user.username,
					'side': player.side,
				} for player in self.players.all()
			],
			'is_tournament': self.tournament is not None
			}


	@classmethod
	def join_game(cls, room_name, user):
		"""Join a game room and return both room data and player data"""
		try:
			room = cls.objects.get(name=room_name)
			player_data = room.join(user)
			return {
				'room': room,
				'player': player_data,
				'status': room.status,
			}
		except (cls.DoesNotExist, ValidationError) as e:
			logger.error(f"Error joining game room: {e}")
			return None


	def join(self, user):
		"""Player joins the game room"""
		with transaction.atomic():
			# Check if room is joinable
			if self.status != 'waiting':
				raise ValidationError("Game has already started")

			# Check if player is already in the game
			if self.players.filter(user=user).exists():
				player = self.players.get(user=user)
				player.save()
				return {
					'id': user.id,
					'username': user.username,
					'side': player.side,
				}

			# Check if room is full
			if self.players.count() >= self.player_count:
				raise ValidationError("Game room is full")

			# Determine available sides
			taken_sides = set(self.players.values_list('side', flat=True))
			available_sides = [side[0] for side in self.SIDES
							  if side[0] not in taken_sides][:self.player_count]

			if not available_sides:
				raise ValidationError("No available positions")

			# Create player and assign first available side
			player = GamePlayer.objects.create(
				room=self,
				user=user,
				side=available_sides[0],
			)

			return {
				'id': player.user.id,
				'username': player.user.username,
				'side': player.side,
			}


	def leave(self, user):
		"""Player leaves the game room"""
		with transaction.atomic():
			try:
				player = self.players.get(user=user)
			except GamePlayer.DoesNotExist:
				raise ValidationError("Player not in this game")

			player.delete()

			# Update room status
			if not self.players.exists():
				# No players left, delete the room
				self.is_active = False # Delete the room in production
				return None


	def end(self, scores):
		"""Save game results and create a permanent record"""
		try:
			with transaction.atomic():
				# Make sure game was in progress
				if self.status != 'in_progress':
					raise ValidationError("Game not in progress")

				if not scores:
					raise ValidationError("No scores provided")

				# Get the winner based on highest score
				try:
					winner_id = max(scores.items(), key=lambda x: x[1])[0]
				except (ValueError, AttributeError):
					raise ValidationError("No winners found, cannot save results")

				# Create the permanent game record
				game_record = GameResult.objects.create()

				# Save player scores
				for player in self.players.all():
					player_id = str(player.user.id)
					score = scores.get(player_id, 0)
					PlayerResult.objects.create(
						game=game_record,
						user=player.user,
						score=score,
						is_winner=player_id == winner_id
					)

				# If this is a tournament game, notify the tournament
				if self.tournament:
					self.tournament.game_completed(self, game_record)

				# Delete the game room after saving results
				self.delete()

				return game_record
		except ValidationError as e:
			logger.error(f"Error ending game: {e}")
			return None

	def handle_disconnect(self, user):
		"""Handle player disconnect by removing them from the game"""
		return self.leave(user)


class GamePlayer(models.Model):
	"""
	Represents a player in an active game room
	"""
	room = models.ForeignKey(GameRoom, on_delete=models.CASCADE, related_name='players')
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	side = models.CharField(max_length=10)

	class Meta:
		unique_together = ['room', 'user']


class GameResult(models.Model):
	"""
	Permanent record of a completed game
	"""
	date = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-date']

	@property
	def player_count(self):
		return self.results.count()

	@property
	def winner(self):
		"""Return the winner of the game"""
		winner = self.results.filter(is_winner=True).first()
		return winner.user if winner else None

	def get_results(self):
		"""Get formatted game results"""
		return {
			'id': self.id,
			'date': self.date.isoformat(),
			'players': [
				{
					'user_id': result.user.id,
					'username': result.user.username,
					'score': result.score,
					'is_winner': result.is_winner
				} for result in self.results.all()
			]
		}


class PlayerResult(models.Model):
	"""
	Individual player result for a completed game
	"""
	game = models.ForeignKey(GameResult, on_delete=models.CASCADE, related_name='results')
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='game_results')
	score = models.IntegerField(default=0)
	is_winner = models.BooleanField(default=False)

	class Meta:
		unique_together = ['game', 'user']