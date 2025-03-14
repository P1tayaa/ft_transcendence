from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError
from django.db import transaction
import json
from rest_framework.decorators import api_view
from apps.game.models.tournament import TournamentRoom, TournamentParticipant, TournamentMatch, TournamentScore

@login_required
@api_view(["POST"])
def create_tournament(request):
    data = json.loads(request.body)
    try:
        config_data = data.get('config')
        if not config_data:
            return JsonResponse({'status': 'error', 'message': 'No configuration provided'}, status=400)

        tournament = TournamentRoom.objects.create(
            tournament_name=data['tournament_name'],
            max_participants=data.get('max_participants', 8),
            creator=request.user,
            config=config_data
        )
        tournament.join_tournament(request.user) # creator joints tournament automatically
        return JsonResponse({
            'tournament_id': tournament.id,
            'tournament_name': tournament.tournament_name,
            'status': tournament.status
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@login_required
@api_view(["POST"])
def join_tournament(request, tournament_id):
    tournament = get_object_or_404(TournamentRoom, id=tournament_id)
    try:
        tournament.join_tournament(request.user)
        return JsonResponse({'status': 'success'})
    except ValidationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    
@login_required
@api_view(["GET"])
def get_tournament_data(request, tournament_id):
    tournament =get_object_or_404(TournamentRoom, id=tournament_id)
    return JsonResponse({
        'tournament_info': {
            'id': tournament.id,
            'name': tournament.name,
            'status': tournament.status,
            'creator': tournament.creator.username,
            'max_participants': tournament.max_participants,
        },
        **tournament.get_standings(),
        **tournament.get_tournament_status(),
    })

@login_required
@api_view(["POST"])
def update_match_score(request, match_id):
    match = get_object_or_404(TournamentMatch, id=match_id)
    
    if not match.player_states.filter(player=request.user).exists():
        return JsonResponse({'error': 'Not authorized'}, status=403)
    

    data = json.loads(request.body)
    try:
        with transaction.atomic():
            player_scores = data.get('player_scores', {})

            if len(player_scores) != match.player_states.count():
                return JsonResponse({'error': 'Invalid score data: must provide scores for all players'}, status=400)
            
            for player_id, score in player_scores.items():
                player_state = match.player_states.get(player=player_id)
                player_state.score = score
                player_state.save()

            if data.get('is_complete'):
                winner_state = match.player_states.order_by('-score').first()
                scores = {str(ps.player.id): ps.score for ps in match.player_states.all()}
                match.complete_game(winner_state.player.id, scores)

        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
@api_view(["GET"])
def list_tournaments(request):
    available_tournaments =TournamentRoom.get_available_tournaments()

    tournament_list = [{
        'id': t.id,
        'name': t.tournament_name,
        'creator': t.creator.username,
        'participants': t.participants.count(),
        'max_participants': t.max_participants,
        'created_at': t.created_at,
        'config': {
            'mode': t.config.mode,
            'map_style': t.config.map_style,
            'powerups_enabled': t.config.powerups_enabled
        }
    } for t in available_tournaments]

    return JsonResponse({
        'tournaments': tournament_list
    })
