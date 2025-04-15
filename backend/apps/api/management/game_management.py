from django.core.exceptions import ValidationError
from django.http import JsonResponse
import json
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.game.models.game import GameConfig, GameRoom



@ensure_csrf_cookie
@api_view(["POST"])
def get_config_game_room(request):
	try:
		game_name = request.GET.get('name')
		if not game_name:
			return JsonResponse({'status': 'error', 'message': 'No room name provided'}, status=400)

		# Fetch the game room by name
		try:
			game_room = GameRoom.objects.get(room_name=game_name)
		except GameRoom.DoesNotExist:
			return JsonResponse({'status': 'error', 'message': 'Game room not found'}, status=404)

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
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)

	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)



@api_view(['POST'])
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
			# Convert validation error dictionary to a single line message
			error_msg = "; ".join([f"{field}: {', '.join(errors)}" for field, errors in e.message_dict.items()])
			return JsonResponse({ 'status': 'error', 'message': error_msg}, status=400)

		game_room = GameRoom.objects.create(
			room_name = f"game-{request.user.username}-{game_config.id}",
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
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@api_view(['GET'])
def list_game_rooms(request):
	try:
		# Get all game rooms
		game_rooms = GameRoom.objects.all()
		
		# Format the response data
		rooms_data = [room.get_room_status() for room in game_rooms]
		
		return JsonResponse({'rooms': rooms_data})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
