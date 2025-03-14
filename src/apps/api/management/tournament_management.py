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
from apps.game.models.game import GameConfig

@login_required
@api_view(["POST"])
def create_tournament(request):
    try:
        data = request.data
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

        tournament = TournamentRoom.objects.create(
            tournament_name = f"tournament_{request.user.username}_{game_config.id}",
            max_participants = data.get('max_participants', 4),
            creator = request.user,
            config = game_config
        )
        tournament.join_tournament(request.user) # creator joints tournament automatically
        return JsonResponse({
            'tournament_id': tournament.id,
            'tournament_name': tournament.tournament_name,
            'status': tournament.status
        })
    except Exception as e:
        return JsonResponse({'message': str(e)}, status=400)


@login_required
@api_view(["POST"])
def join_tournament(request):
    try:
        tournament_id = request.data.get('tournament_id')
        tournament = get_object_or_404(TournamentRoom, id=tournament_id)

        tournament.join_tournament(request.user)
        return JsonResponse({'status': 'success'})
    except ValidationError as e:
        return JsonResponse({'message': str(e)}, status=400)

@login_required
@api_view(["GET"])
def get_tournament_data(request):
    tournament_id = request.query_params.get('tournament_id')

    tournament = get_object_or_404(TournamentRoom, id=tournament_id)

    response = {
        'info': {
            'id': tournament.id,
            'name': tournament.tournament_name,
            'status': tournament.status,
            'creator': tournament.creator.username,
            'max_participants': tournament.max_participants,
        }
    }

    standings = tournament.get_standings()
    response['standings'] = [
        {
            'player': score.player.username,
            'matches_played': score.matches_played,
            'wins': score.wins,
            'losses': score.losses,
            'points': score.points
        } for score in standings
    ]

    response['status'] = [
        tournament.get_tournament_status()
    ]

    return JsonResponse(response)

@login_required
@api_view(["POST"])
def update_match_score(request):
    match_id = request.query_params.get('match_id')
    match = get_object_or_404(TournamentMatch, id=match_id)
    
    if not match.player_states.filter(player=request.user).exists():
        return JsonResponse({'message': 'Not authorized'}, status=403)
    

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
        return JsonResponse({'message': str(e)}, status=400)

@login_required
@api_view(["GET"])
def list_tournaments(request):
    available_tournaments = TournamentRoom.get_available_tournaments()

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

@login_required
@api_view(["POST"])
def leave_tournament(request):
    data = request.data
    player_id = request.user.id
    tournament_id = data.get('tournament_id')
    if not tournament_id:
        return JsonResponse({'success': False, 'message': "tournament_id is required"})

    try:
        tournament = TournamentRoom.object.get(id=tournament_id)
        participant = TournamentParticipant.object.get(player=player_id)
        if not participant:
            return JsonResponse({'success': False, 'message': "Could not find TournamentParticipant"})

        if tournament.status == "WAITING":
            TournamentScore.object.filter(tournament=tournament_id, player=player_id).delete()

        elif tournament.status == "IN_PROGRESS":
            participant.is_active = False
            participant.save()

            active_matches = TournamentMatch.object.filter(tournament=tournament_id, player_states__player=player_id)
            for match in active_matches:
                opponent_state = match.player_states.exclude(player=player_id).first()
                if opponent_state:
                    scores = {
                        str(opponent_state.player.id): 1,
                        str(player_id): 0
                    }
                    match.complete_game(opponent_state.player.id, scores)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

