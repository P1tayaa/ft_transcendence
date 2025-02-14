from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import transaction
import math
import random
from apps.users.models import ScoreHistory

class PlayerState(models.Model):
    game = models.ForeignKey('GameRoom', related_name='player_states', on_delete=models.CASCADE)
    player = models.ForeignKey(User, related_name='game_states', on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    final_score = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ['game', 'player', 'is_active']
    
class GameConfig(models.Model):
    GAME_MODES = (
        ('networked', 'Networked'),
        ('local', 'Local'),
        # Add other modes as needed
    )
    
    MAP_STYLES = (
        ('classic', 'Classic'),
        # Add other styles as needed
    )
    
    PLAYER_SIDES = (
        ('left', 'Left'),
        ('right', 'Right'),
        ('top', 'Top'),
        ('bottom', 'Bottom')
    )

    mode = models.CharField(max_length=50, choices=GAME_MODES)
    server_url=models.URLField(blank=True)
    player_count = models.IntegerField(validators=[MinValueValidator(2), MaxValueValidator(4)])
    map_style = models.CharField(max_length=20, choices=MAP_STYLES)

    # features
    powerups_enabled = models.BooleanField(default=False)
    bots_enabled = models.BooleanField(default=False)
    is_host = models.BooleanField(default=False)
    spectator_enabled = models.BooleanField(default=True)

    # complex data
    powerup_list = models.JSONField(default=list, blank=True)
    player_sides = models.JSONField(default=list)
    bot_sides = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        errors = {}

        if len(self.player_sides) != self.player_count:
            errors['player_sides'] = f'Number of player sides ({len(self.player_sides)}) must match player count ({self.player_count})'

        valid_sides = [side[0] for side in self.PLAYER_SIDES]
        for side in self.player_sides:
            if side not in valid_sides:
                errors['player_sides'] = f'Invalid side: {side}'

        if self.bots_enabled and not self.bot_sides:
            errors['bot_sides'] = 'Bot sides mut be specificed when bots are enabled'

        if self.mode == 'networked' and not self.server_url:
            errors['server_url'] = 'Server URL is required for NETWORK mode'

        if errors:
            raise ValidationError(errors)

    @classmethod
    def validate_config_json(cls, config_json):
        required_fields = {'mode', 'playerCount', 'map_style', 'playerside'}
        errors = {}

        for field in required_fields:
            if field not in config_json:
                errors[field] = f"Missing required field: {field}"
        player_count = 0
        try:
            player_count = int(config_json.get('playerCount', 0))
            if not 2 <= player_count <= 4:
                errors['playerCount'] = "Player count must be between 2 and 4"
        except ValueError:
            errors['playerCount'] = "Playercount must be a number"

        player_sides =config_json.get('playerside', [])
        if len(player_sides) != player_count:
            errors['playerside'] = f"Number of player sides ({len(player_sides)}) must match player count ({player_count})"

        if config_json.get('bots', '') == 'true':
            if 'botSide' not in config_json or not config_json['botSide']:
                errors['botSide'] = "Bot sides must be specified when bots are enabled"

        if config_json.get('mode') == 'networked' and not config_json.get('serverurl'):
            errors['serverurl'] = "Server URL is required for NETWORK mode"

        return (len(errors) == 0, errors)

    @classmethod
    def create_from_frontend(cls, config_json):
        is_valid, errors = cls.validate_config_json(config_json)
        if not is_valid:
            raise ValidationError(errors)

        return cls.from_dict(config_json)
    
    @classmethod
    def from_dict(cls, config_dict):
        return cls(
            mode=config_dict['mode'],
            server_url=config_dict.get('serverurl', ''),
            powerups_enabled=config_dict.get('powerup', 'false') == 'true',
            powerup_list=config_dict.get('poweruplist', []),
            player_count=int(config_dict['playerCount']),
            map_style=config_dict['map_style'],
            player_sides=config_dict['playerside'],
            bots_enabled=config_dict.get('bots', 'false') == 'true',
            bot_sides=config_dict.get('botsSide', []),
            is_host=config_dict.get('host', 'false') == 'true',
            spectator_enabled=config_dict.get('Spectator', 'false') == 'true'
        )

    def to_dict(self):
        return {
            'mode': self.mode,
            'serverurl': self.server_url,
            'powerup': str(self.powerups_enabled),
            'poweruplist': self.powerup_list,
            'playerCount': str(self.player_count),
            'map_style': self.map_style,
            'playerside': self.player_sides,
            'bots': str(self.bots_enabled),
            'botsSide': self.bot_sides,
            'host': str(self.is_host),
            'Spectator': str(self.spectator_enabled)
        }

    def __str__(self):
        return f"{self.mode} game - {self.player_count} players - {self.map_style}"



class BaseGameRoom(models.Model):
    ROOM_STATUS = (        
        ('WAITING', 'Waiting for players'),
        ('IN_PROGRESS', 'Tournament in Progress'),
        ('COMPLETED', 'Tournament Completed')
    )

    room_name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices = ROOM_STATUS, default = 'WAITING')
    config = models.ForeignKey(GameConfig, on_delete=models.PROTECT, related_name='game_rooms')

    class Meta:
        abstract = True

class GameRoom(BaseGameRoom):
    def get_players(self):
        return self.player_states.filter(is_active=True)

    def get_player_count(self):
        return self.get_players().count()

    def is_full(self):
         return self.get_player_count() >= self.config.player_count

    def get_available_sides(self):
        taken_sides = set(
            self.player_states.filter(is_active=True).values_list('side', flat=True)
        )
        return [side for side in self.config.player_sides if side not in taken_sides]

    def get_available_rooms(self):
        return GameRoom.objects.filter(
            status='WAITING',
            is_active = True
        )

    def join_game(self, player): # Player is User object
        if self.status != 'WAITING':
            raise ValidationError("Game is not open for joining")

        if self.is_full():
            return ValidationError("Game room is full")

        with transaction.atomic():
            if self.player_states.filter(player=player, is_active=True).exists():
                raise ValidationError("Player already in game")
            available_side = self.get_available_sides()
            if not available_side:
                raise ValidationError("No available sides")

            player_number = self.get_player_count() + 1
            PlayerState.objects.create(
                game = self,
                player = player,
                player_number = player_number,
                side = available_side[0],
                score = 0
            )

            if self.is_full():
                self.status = 'IN_PROGRESS'
                self.save()
            return True

    def leave_game(self, player):
        if self.status == 'COMPLETED':
            raise ValidationError("Cannot leave a completed game")

        with transaction.atomic():
            player_state = self.player_states.filter(player=player, is_active=True).first()
            if not player_state:
                raise ValidationError("Player not in this game")

            player_state.is_active = False
            player_state.save()

            if self.get_player_count() == 0:
                self.is_active = False,
                self.save()
            elif self.status == 'IN_PROGRESS':
                self.status = 'WAITING'
                self.save()

    def update_score(self, player, score):
        if self.status != 'IN_PROGRESS':
            raise ValidationError("Can only update scores for game in progress")

        player_state = self.player_states.filter(player=player, is_active=True).first()
        if not player_state:
            raise ValidationError("Player not in this game")

        player_state.score = score
        player_state.save()

    def complete_game(self, winner_id, scores):
        if self.status != 'IN_PROGRESS':
            raise ValidationError("Game is not in progress")

        with transaction.atomic():
            self.status = 'COMPLETED'
            self.is_active = False
            self.save()

            # if needed, get winner as User
            winner = User.objects.get(id=int(winner_id))
            for player_state in self.get_players():
                user_id = str(player_state.player.id)
                final_score = scores.get(user_id, 0)
                player_state.final_score = final_score
                player_state.save()

                ScoreHistory.objects.create(
                    profile=player_state.player.profile,
                    score=final_score
                )

    def get_game_status(self):
        players = self.get_players()
        return {
            'room_name': self.room_name,
            'status': self.status,
            'game_mode': self.config.mode,
            'map_style': self.config.map_style,
            'current_players': self.get_player_count(),
            'max_players': self.config.player_count,
            'players': [{
                'number': ps.player_number,
                'username': ps.player.username,
                'side': ps.side,
                'score': ps.score
            } for ps in players],
            'is_active': self.is_active,
            'powerups_enabled': self.config.powerups_enabled,
            'bots_enabled': self.config.bots_enabled
        }
