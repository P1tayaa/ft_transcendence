from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import transaction
from apps.users.models import PlayerScore, Game


class PlayerState(models.Model):
    game = models.ForeignKey('GameRoom', related_name='player_states', on_delete=models.CASCADE)
    player = models.ForeignKey(User, related_name='game_states', on_delete=models.CASCADE)
    player_number = models.IntegerField(default=0)
    score = models.IntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)
    final_score = models.IntegerField(null=True, blank=True)
    side = models.CharField(max_length=20, blank=True)
    is_ready = models.BooleanField(default=False)

    class Meta:
        unique_together = ['game', 'player']
    
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
    # server_url=models.URLField(blank=True)
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
            # server_url=config_dict.get('serverurl', ''),
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
            # 'serverurl': self.server_url,
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
    is_tournament_game = models.BooleanField(default=False)

    class Meta:
        abstract = True

class GameRoom(BaseGameRoom):
    players = models.ManyToManyField(
        'auth.User',
        related_name='game_rooms'
    )

    def get_room_status(self):
        with transaction.atomic():
            all_players = self.player_states.all()
            players = [{
                'id': player.player.id,
                'username': player.player.username,
                'side': player.side,
                'player_number': player.player_number,
                'is_ready': player.is_ready
            } for player in all_players]

            return {
                'config': self.config.to_dict(),
                'name': self.room_name,
                'status': self.status,
                'players': players
            }

    def join_game(self, player):
        try:
            if self.status != 'WAITING':
                raise ValidationError("Game is not open for joining")

            with transaction.atomic():
                players = self.player_states.select_for_update()

                current_player = players.filter(player=player).first()
                if current_player:
                    return {
                        'side': current_player.side,
                        'player_number': current_player.player_number,
                        'is_host': current_player.player_number == 1
                    }

                if players.count() >= self.config.player_count:
                    raise ValidationError("Game Room is full")

                taken_sides = {p.side for p in players}
                available_sides = [s for s in self.config.player_sides if s not in taken_sides]

                if not available_sides:
                    raise ValidationError("No available sides")

                current_player = PlayerState.objects.create(
                    game = self,
                    player = player,
                    player_number = players.count() + 1,
                    side = available_sides[0],
                    score = 0,
                )

                return {
                    'side': current_player.side,
                    'player_number': current_player.player_number,
                    'is_host': current_player.player_number == 1
                }
        except Exception as e:
            raise ValidationError(str(e))

    def leave_game(self, player):
        try:
            with transaction.atomic():
                # Get players
                players = self.player_states.select_for_update()

                if players.count == 0:
                    raise ValidationError("Game room is empty")

                try:
                    current_player = players.get(player=player)
                except PlayerState.DoesNotExist:
                    raise ValidationError("Player not in game")

                # Set player numbers
                player_number = current_player.player_number

                for p in players:
                    if p.player_number > player_number:
                        p.player_number -= 1
                        p.save()

                if players.count() == 0:
                    self.is_active = False
                    self.save()
                elif self.status == 'IN_PROGRESS' and players.count() < self.config.player_count:
                    self.status = 'WAITING'
                    self.save()

                # Delete player state
                current_player.delete()

        except Exception as e:
            raise ValidationError(str(e))

    # This method is called when a player is ready to start the game
    # Return: True if all players are ready, False otherwise
    def set_player_ready(self, player):
        with transaction.atomic():
            try:
                player_state = self.player_states.select_for_update().get(player=player)
            except PlayerState.DoesNotExist:
                raise ValidationError("Player not in game")

            player_state.is_ready = True
            player_state.save()

            active_players = self.player_states.all()
            if active_players.count() < self.config.player_count:
                return False

            for player in active_players:
                if not player.is_ready:
                    return False

            return True

    def save_game_result(self, winner_id, scores):
        with transaction.atomic():
            if self.status != 'IN_PROGRESS':
                raise ValidationError("Game not in progress")

            self.status = 'COMPLETED'
            self.save()

            game = Game.objects.create(winner=User.objects.get(id=winner_id).profile)

            active_players = self.player_states
            for player_state in active_players:
                final_score = scores.get(str(player_state.player.id), 0)
                player_state.final_score = final_score
                player_state.save()

                PlayerScore.objects.create(
                    game=game,
                    profile=player_state.player.profile,
                    score=final_score,
                    position=player_state.side
                )


    @classmethod
    def get_available_rooms(cls):
        with transaction.atomic():
            return (cls.objects
                .select_related('config')
                .filter(
                    is_active=True,
                    status='WAITING',
                    is_tournament_game=False
                ))    
