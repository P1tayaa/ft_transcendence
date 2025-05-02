from django.http import JsonResponse
import json
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import logging

from apps.game.models.game import GameRoom


logger = logging.getLogger(__name__)


@ensure_csrf_cookie
@api_view(["GET"])
def get_config_game_room(request):
	try:
		game_name = request.GET.get('name')
		if not game_name:
			return JsonResponse({'status': 'error', 'message': 'No room name provided'}, status=400)

		# Fetch the game room by name
		try:
			game_room = GameRoom.objects.get(name=game_name)
		except GameRoom.DoesNotExist:
			return JsonResponse({'status': 'error', 'message': 'Game room not found'}, status=404)

		return JsonResponse({
			'status': 'success',
			'room_id': game_room.id,
			'room_name': game_room.name,
			'map': game_room.map,
			'playercount': game_room.player_count,
		})

	except json.JSONDecodeError:
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)

	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@ensure_csrf_cookie
@api_view(['POST'])
def create_game_room(request):
	try:
		data = json.loads(request.body)
		config_data = data.get('config')

		if not config_data:
			return JsonResponse({'status': 'error', 'message': 'No configuration provided'}, status=400)
		
		logger.info(f"Creating game room with config: {config_data}")

		# Create GameRoom directly with parameters from config_data
		room_name = f"game-{request.user.username}-{GameRoom.objects.count()+1}"
		
		game_room = GameRoom.objects.create(
			name=room_name,
			map=config_data.get('map'),
			player_count=config_data.get('players'),
		)

		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			"matchmaking",
			{
				"type": "room_created",
				"data": {
					"type": "game_room",
					"id": game_room.id,
					"name": game_room.name,
					"map": game_room.map,
					"players": game_room.players.count(),
					"max_players": game_room.player_count,
				}
			}
		)

		return JsonResponse({
			'status': 'success',
			'room_id': game_room.id,
			'room_name': game_room.name,
		})
	except json.JSONDecodeError:
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@ensure_csrf_cookie
@api_view(['GET'])
def list_game_rooms(request):
	try:
		# Get all active game rooms
		game_rooms = GameRoom.objects.filter(is_active=True)
		
		# Format the response data
		rooms_data = [room.get_status() for room in game_rooms]
		
		return JsonResponse({'status': 'success', 'rooms': rooms_data})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

