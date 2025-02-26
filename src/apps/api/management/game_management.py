from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import JsonResponse
import json
from apps.game.models.game import GameConfig, GameRoom, PlayerState,BaseGameRoom
from django.db import transaction


# added by sam
@login_required
@require_http_methods(["POST"])
def get_config_game_room(request):
    try:
        data = json.loads(request.body)
        game_name = data.get('roomName')
        if not game_name:
            return JsonResponse({
                'status': 'error',
                'message': 'No room name provided'
            }, status=400)

        # Fetch the game room by name
        try:
            game_room = GameRoom.objects.get(room_name=game_name)
        except GameRoom.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Game room not found'
            }, status=404)

        # Get the game configuration
        game_config = game_room.config

        return JsonResponse({
            'status': 'success',
            'room_id': game_room.id,
            'room_name': game_room.room_name,
            'config': game_config.to_dict(),
            'available_sides': game_room.get_available_sides(),
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON data'
        }, status=400)

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e),
        }, status=500)   

@login_required
@require_http_methods(["POST"])
def create_game_room(request):
    try:
        data = json.loads(request.body)
        config_data = data.get('config')

        if not config_data:
            return JsonResponse({
                'status': 'error',
                'message': 'No configuration provided'
            }, status=400)

        try:
            game_config = GameConfig.create_from_frontend(config_data)
            game_config.clean()
            game_config.save()
        except ValidationError as e:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid configuration',
                'errors': e.message_dict,
            }, status=400)

        game_room = GameRoom.objects.create(
            room_name = f"game_{request.user.username}_{game_config.id}",
            config = game_config,
            # max_players = int(config_data['playerCount'])
        )
    
        # game_room.join_game(request.user)
        return JsonResponse({
            'status': 'success',
            'room_id': game_room.id,
            'room_name': game_room.room_name,
            'config': game_config.to_dict()
        })
    except json.JSONDecodeError:
        return JsonResponse({
             'status': 'error',
             'message': 'Invalid JSON data',
         }, status=400)
    except Exception as e:
        return JsonResponse({
             'status': 'error',
             'message': str(e),
         }, status=500)


@login_required
@require_http_methods(["POST"])
def clear_chat_data(request):
    try:
        with transaction.atomic():
            chat_count = Chat.objects.count()

            Chat.objects.all().delete()
            return JsonResponse({
                'status': 'success',
                'message': 'All chats cleared successfully',
                'deleted': {
                    'chats': chat_count
                }
            })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Failed to clear game rooms: {str(e)}'
        }, status=500)


# @user_passes_test(lambda u: u.is_staff)  # Only allow staff users to clear rooms
@login_required
@require_http_methods(["POST"])
def clear_game_rooms(request):
    try:
        with transaction.atomic():
            # Get counts before deletion for reporting
            player_states_count = PlayerState.objects.count()
            game_rooms_count = GameRoom.objects.count()
            game_configs_count = GameConfig.objects.count()
            
            # Delete all player states first (due to foreign key relationships)
            PlayerState.objects.all().delete()
            
            # Delete all game rooms
            GameRoom.objects.all().delete()
            
            # Optionally, delete all game configs if you want to start completely fresh
            GameConfig.objects.all().delete()


            return JsonResponse({
                'status': 'success',
                'message': 'All game rooms cleared successfully',
                'deleted': {
                    'player_states': player_states_count,
                    'game_rooms': game_rooms_count,
                    'game_configs': game_configs_count
                }
            })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Failed to clear game rooms: {str(e)}'
        }, status=500)
