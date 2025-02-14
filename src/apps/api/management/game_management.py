from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import JsonResponse
import json
from apps.game.models.game import GameConfig, GameRoom

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
            game_config.full_clean()
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
            max_players = int(config_data['playercount'])
        )
    
        game_room.join_game(request.user)
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
