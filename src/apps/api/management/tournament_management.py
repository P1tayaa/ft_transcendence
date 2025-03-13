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
            max_participants = data.get('max_participants', 8),
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
        tournament_id = request.query_params.get('tournament_id')
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

    return JsonResponse(response)

@login_required
@api_view(["POST"])
def update_match_score(request):
    match_id = request.query_params.get('match_id')
    match = get_object_or_404(TournamentMatch, id=match_id)
    if request.user not in [match.player1, match.player2]:
        return JsonResponse({'message': 'Not authorized'}, status=403)

    data = json.loads(request.body)
    try:
        with transaction.atomic():
            match.score1 = data['score1']
            match.score2 = data['score2']
            match.save()

            if data.get('is_complete'):
                winner = match.player1 if match.score1 > match.score2 else match.player2
                match.tournament.process_completed_match(match, winner)

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
