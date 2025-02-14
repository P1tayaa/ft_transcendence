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
        tournament = TournamentRoom.objects.create(
            tournament_name=data['tournament_name'],
            max_participant=data.get('max_participants', 8),
            creator=request.user
        )
        tournament.join_tournament(request.user) # creator joints tournament automatically
        return JsonResponse({
            'tournament_id': tournament.id,
            'tournament_name': tournament.name,
            'status': tournament.status
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@login_required
@api_view(["POST"])
def join_tournament(request, tournament_id):
    tournament = get_object_or_404(TournamentMatch, id=tournament_id)
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
        'standings': tournament.get_standings(),
        'status': tournament.get_tournament_status(),
    })

@login_required
@api_view(["POST"])
def update_match_score(request, match_id):
    match = get_object_or_404(TournamentMatch, id=match_id)
    if request.user not in [match.player1, match.player2]:
        return JsonResponse({'error': 'Not authorized'}, status=403)

    data = json.loads(request.body)
    try:
        with transaction.atomic():
            match.score1 = data['score1']
            match.score2 = data['score2']
            match.save()

            if data.get('is_complete'):
                winner = match.player1 if match.score1 > match.score2 else match.player2
                match.tournament.complete_match(match, winner)

        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
