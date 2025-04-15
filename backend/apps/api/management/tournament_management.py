from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django.db import transaction
import json
from rest_framework.decorators import api_view
from apps.game.models.tournament import TournamentRoom, TournamentParticipant, TournamentMatch, TournamentScore
from apps.game.models.game import GameConfig

@permission_classes([IsAuthenticated])
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


@permission_classes([IsAuthenticated])
@api_view(["POST"])
def join_tournament(request):
    try:
        tournament_id = request.data.get('tournament_id')
        tournament = get_object_or_404(TournamentRoom, id=tournament_id)

        tournament.join_tournament(request.user)
        return JsonResponse({'status': 'success'})
    except ValidationError as e:
        return JsonResponse({'message': str(e)}, status=400)

@permission_classes([IsAuthenticated])
@api_view(["GET"])
def get_tournament_data(request):
    tournament_id = request.query_params.get('tournament_id')

    tournament = get_object_or_404(TournamentRoom, id=tournament_id)

    response = tournament.get_tournament_data()

    return JsonResponse(response)

@permission_classes([IsAuthenticated])
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

@permission_classes([IsAuthenticated])
@api_view(["GET"])
def list_tournaments(request):
    available_tournaments = TournamentRoom.get_available_tournaments()

    tournament_list = [tournament.get_tournament_data() for tournament in available_tournaments]

    return JsonResponse({'tournaments': tournament_list})

@permission_classes([IsAuthenticated])
@api_view(["POST"])
def leave_tournament(request):
    data = request.data
    tournament_id = data.get('tournament_id')
    if not tournament_id:
        return JsonResponse({'success': False, 'message': "tournament_id is required"})

    try:
        tournament = TournamentRoom.objects.get(id=tournament_id)
        tournament.leave_tournament(request.user)
        return JsonResponse({'success': True, 'message': 'succesfully left tournament'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)

