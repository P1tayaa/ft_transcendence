from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import JsonResponse
import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.game.models.game import GameConfig, GameRoom, PlayerState,BaseGameRoom
from apps.game.models.tournament import TournamentScore, TournamentParticipant, TournamentMatch, TournamentRoom
from django.db import transaction
from apps.users.models import Chat


# added by sam
@login_required
@require_http_methods(["GET"])
def get_config_game_room(request):
    try:
        game_name = request.GET.get('name')
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

        return JsonResponse(game_room.get_room_status())

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
            return JsonResponse({'status': 'error', 'message': 'No configuration provided'}, status=400)

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
        )

        channel_layer = get_channel_layer()
        room_data = {
            'room_id': game_room.id,
            'room_name': game_room.room_name,
            'config': game_config.to_dict(),
        }

        async_to_sync(channel_layer.group_send)(
            "matchmaking",
            {
                "type": "game_created",
                "room": room_data,
            }
        )

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
        return JsonResponse({'status': 'error', 'message': f'Failed to clear game rooms: {str(e)}'}, status=500)

@login_required
@require_http_methods(["POST"])
def reset_dev_game_database(request):
    try:
        with transaction.atomic():
            deleted_counts = {}

            # Order matters - delete dependent models first
            models_to_delete = [
                PlayerState,
                TournamentScore,
                TournamentParticipant,
                TournamentMatch,
                TournamentRoom,
                GameRoom,
                GameConfig
            ]

            for model in models_to_delete:
                count = model.objects.count()
                model_name = model.__name__
                model.objects.all().delete()
                deleted_counts[model_name] = count

            return JsonResponse({
                'success': True,
                'message': 'Dev database reset successfully',
                'deleted': deleted_counts
            }, status=200)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Reset failed: {str(e)}'
        }, status=500)