from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.db import transaction
import json
from rest_framework.decorators import api_view
from apps.game.models.lobby import Lobby, LobbyPlayer, LobbyChat
from apps.game.models.game import GameRoom, GameConfig

@login_required
@api_view(["POST"])
def create_lobby(request):
    try:
        data = json.loads(request.body)
        lobby = Lobby.objects.create(
            name=data['name'],
            max_players=data.get('max_players', 8),
            creator=request.user,
            description=data.get('description', '')
        )
        
        lobby.add_player(request.user)
        
        return JsonResponse({
            'status': 'success',
            'lobby_id': lobby.id,
            'lobby_name': lobby.name,
        })
    except ValidationError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@api_view(["POST"])
def join_lobby(request, lobby_id):
    lobby = get_object_or_404(Lobby, id=lobby_id)

    try:
        lobby_player = lobby.add_player(request.user)
        return JsonResponse({
            'status': 'success',
            'lobby': lobby.get_lobby_state()
        })
    except ValidationError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@api_view(["POST"])
def leave_lobby(request, lobby_id):
    lobby = get_object_or_404(Lobby, id=lobby_id)
    
    try:
        lobby.remove_player(request.user)
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required
@api_view(["POST"])
def set_player_ready(request, lobby_id):
    lobby = get_object_or_404(Lobby, id=lobby_id)
    
    try:
        all_ready = lobby.set_player_ready(request.user)
        
        response_data = {
            'status': 'success',
            'all_ready': all_ready,
            'lobby': lobby.get_lobby_state()
        }
        
        return JsonResponse(response_data)
    except ValidationError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required
@api_view(["GET"])
def get_lobby_details(request, lobby_id):
    lobby = get_object_or_404(Lobby, id=lobby_id)
    
    return JsonResponse({
        'status': 'success',
        'lobby': lobby.get_lobby_state()
    })


@login_required
@api_view(["GET"])
def list_lobbies(request):
    available_lobbies = Lobby.get_available_lobbies()
    
    lobby_list = [{
        'id': lobby.id,
        'name': lobby.name,
        'player_count': lobby.lobby_players.filter(is_active=True).count(),
        'max_players': lobby.max_players,
        'creator': lobby.creator.username if lobby.creator else None,
        'description': lobby.description,
        'created_at': lobby.created_at,
    } for lobby in available_lobbies]
    
    return JsonResponse({
        'status': 'success',
        'lobbies': lobby_list
    })


@login_required
@api_view(["POST"])
def start_game_from_lobby(request, lobby_id):
    lobby = get_object_or_404(Lobby, id=lobby_id)

    if request.user != lobby.creator:
        return JsonResponse({'status': 'error', 'message': 'Only the lobby creator can start a game'}, status=403)

    try:
        data = json.loads(request.body)
        config_data = data.get('config')

        if not config_data:
            return JsonResponse({'status': 'error', 'message': 'No game configuration provided'}, status=400)
    
