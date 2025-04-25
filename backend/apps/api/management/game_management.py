from django.core.exceptions import ValidationError
from django.http import JsonResponse
import json
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.game.models.game import GameRoom


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

		# Get the game configuration
		game_config = game_room.to_dict()

		return JsonResponse({
			'status': 'success',
			'room_id': game_room.id,
			'room_name': game_room.name,
			'config': game_config,
		})

	except json.JSONDecodeError:
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)

	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
def create_game_room(request):
	try:
		data = json.loads(request.body)
		config_data = data.get('config')

		if not config_data:
			return JsonResponse({'status': 'error', 'message': 'No configuration provided'}, status=400)
		
		logger.info(f"Creating game room with config: {config_data}")

		try:
			# Create GameRoom directly with parameters from config_data
			room_name = f"game-{request.user.username}-{GameRoom.objects.count()+1}"
			
			game_room = GameRoom.objects.create(
				name=room_name,
				map=config_data.get('map'),
				player_count=config_data.get('players'),
			)
		except ValidationError as e:
			# Convert validation error dictionary to a single line message
			error_msg = "; ".join([f"{field}: {', '.join(errors)}" for field, errors in e.message_dict.items()])
			return JsonResponse({ 'status': 'error', 'message': error_msg}, status=400)

		channel_layer = get_channel_layer()
		room_data = {
			'room_id': game_room.id,
			'room_name': game_room.name,
			'config': game_room.to_dict(),
		}

		async_to_sync(channel_layer.group_send)(
			"matchmaking",
			{
				"type": "room_created",
				"room": room_data,
			}
		)

		# Automatically join the host to the game
		player_data = game_room.join(request.user)

		return JsonResponse({
			'status': 'success',
			'room_id': game_room.id,
			'room_name': game_room.name,
			'config': game_room.to_dict(),
			'player': player_data
		})
	except json.JSONDecodeError:
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


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


@api_view(['POST'])
def join_game_room(request):
	try:
		data = json.loads(request.body)
		room_name = data.get('room_name')

		if not room_name:
			return JsonResponse({'status': 'error', 'message': 'Room name is required'}, status=400)

		try:
			game_room = GameRoom.objects.get(name=room_name, is_active=True)
		except GameRoom.DoesNotExist:
			return JsonResponse({'status': 'error', 'message': 'Game room not found'}, status=404)

		try:
			player_data = game_room.join(request.user)
		except ValidationError as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

		# Notify other clients in the room
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f"room_{room_name}",
			{
				"type": "player_update",
				"action": "joined",
				"player": player_data
			}
		)

		return JsonResponse({
			'status': 'success',
			'room_id': game_room.id,
			'room_name': game_room.name,
			'player': player_data,
			'room_status': game_room.status
		})
	except json.JSONDecodeError:
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@api_view(['POST'])
def leave_game_room(request):
	try:
		data = json.loads(request.body)
		room_name = data.get('room_name')

		if not room_name:
			return JsonResponse({'status': 'error', 'message': 'Room name is required'}, status=400)

		try:
			game_room = GameRoom.objects.get(name=room_name)
		except GameRoom.DoesNotExist:
			return JsonResponse({'status': 'error', 'message': 'Game room not found'}, status=404)

		try:
			game_room.leave(request.user)
		except ValidationError as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

		# Notify other clients in the room
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f"room_{room_name}",
			{
				"type": "player_update",
				"action": "left",
				"player_id": request.user.id
			}
		)

		return JsonResponse({
			'status': 'success',
			'message': 'Successfully left the game room'
		})
	except json.JSONDecodeError:
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@api_view(['POST'])
def set_player_ready(request):
	try:
		data = json.loads(request.body)
		room_name = data.get('room_name')
		ready_status = data.get('ready', True)

		if not room_name:
			return JsonResponse({'status': 'error', 'message': 'Room name is required'}, status=400)

		try:
			game_room = GameRoom.objects.get(name=room_name, is_active=True)
		except GameRoom.DoesNotExist:
			return JsonResponse({'status': 'error', 'message': 'Game room not found'}, status=404)

		try:
			game_room.set_ready(request.user, ready=ready_status)
		except ValidationError as e:
			return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

		# Check if all players are ready
		all_ready = all(player.is_ready for player in game_room.players.all())
		
		# Notify other clients in the room
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f"room_{room_name}",
			{
				"type": "player_ready",
				"player_id": request.user.id,
				"ready": ready_status,
				"all_ready": all_ready
			}
		)

		return JsonResponse({
			'status': 'success',
			'message': 'Ready status updated',
			'all_ready': all_ready
		})
	except json.JSONDecodeError:
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@api_view(['POST'])
def start_game(request):
	try:
		data = json.loads(request.body)
		room_name = data.get('room_name')

		if not room_name:
			return JsonResponse({'status': 'error', 'message': 'Room name is required'}, status=400)

		try:
			game_room = GameRoom.objects.get(name=room_name, is_active=True)
		except GameRoom.DoesNotExist:
			return JsonResponse({'status': 'error', 'message': 'Game room not found'}, status=404)

		# Check if user is host
		try:
			player = game_room.players.get(user=request.user)
			if not player.is_host:
				return JsonResponse({'status': 'error', 'message': 'Only the host can start the game'}, status=403)
		except:
			return JsonResponse({'status': 'error', 'message': 'You are not in this game'}, status=403)

		# Check if game is ready to start
		if game_room.status != 'ready':
			return JsonResponse({'status': 'error', 'message': 'Game is not ready to start'}, status=400)

		# Check if all players are ready
		if not all(player.is_ready for player in game_room.players.all()):
			return JsonResponse({'status': 'error', 'message': 'Not all players are ready'}, status=400)

		# Update game status
		game_room.status = 'in_progress'
		game_room.save()

		# Notify WebSocket clients
		channel_layer = get_channel_layer()
		async_to_sync(channel_layer.group_send)(
			f"room_{room_name}",
			{
				"type": "started_game",
				"message": "Game has started!"
			}
		)

		return JsonResponse({
			'status': 'success',
			'message': 'Game started successfully'
		})
	except json.JSONDecodeError:
		return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@api_view(['GET'])
def get_game_status(request):
	try:
		room_name = request.GET.get('room_name')
		if not room_name:
			return JsonResponse({'status': 'error', 'message': 'Room name is required'}, status=400)

		try:
			game_room = GameRoom.objects.get(name=room_name)
		except GameRoom.DoesNotExist:
			return JsonResponse({'status': 'error', 'message': 'Game room not found'}, status=404)

		# Get current game status
		room_status = game_room.get_status()

		return JsonResponse({
			'status': 'success',
			'room_id': game_room.id,
			'room_status': room_status
		})
	except Exception as e:
		return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
