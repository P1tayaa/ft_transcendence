from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from django.db import transaction
from apps.users.models import Game


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_score(request):
    try:
        score = request.data.get("score")
        if score is None:
            return JsonResponse({"success": False, "error": "Score is required"}, status=400)

        try:
            score = int(score)
        except ValueError:
            return JsonResponse({"success": False, "error": "Score must be a number"}, status=400)

        profile = request.user.profile

        with transaction.atomic():
            score_history = profile.scores.create(score=score)
            profile.most_recent_game_score = score

            if score > profile.highscore:
                profile.highscore = score

            profile.save()

        return JsonResponse(
            {
                "success": True,
                "score": {
                    "id": score_history.id,
                    "score": score,
                    "date": score_history.date.isformat(),
                },
                "highscore": profile.highscore,
                "most_recent_score": profile.most_recent_game_score,
            }
        )
    except Exception as e:
        return JsonResponse({"success": True, "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_score_history(request):
    try:
        user_id = request.GET.get("user_id")
        if user_id:
            try:
                profile = User.objects.get(id=user_id).profile
            except User.DoesNotExist:
                return JsonResponse({"success": False, "error": "User not found"}, status=404)
        else:
            profile = request.user.profile

        games = Game.objects.filter(player_scores__profile=profile).distinct() \
            .prefetch_related('player_scores__profile__user') \
            .select_related('winner__user')

        game_history = []
        for game in games:
            players = []
            for player_score in game.player_scores.all():
                players.append({
                    "player": {
                        "id": player_score.profile.user.id,
                        "username": player_score.profile.user.username,
                    },
                    "score": player_score.score,
                    "position": player_score.position
                })

            game_data = {
                "game_id": game.id,
                "date": game.date.isoformat(),
                "players": players,
                "winner": {
                    "id": game.winner.user.id,
                    "username": game.winner.user.username
                } if game.winner else None,
                "player_count": game.player_count
            }
            game_history.append(game_data)

        return JsonResponse({
            "success": True,
            "games": game_history
        })
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_recent_score(request):
    try:
        user_id = request.GET.get("user_id")
        if user_id:
            try:
                profile = User.objects.get(id=user_id).profile
            except User.DoesNotExist:
                return JsonResponse({"success": False, "error": "User not found"}, status=404)
        else:
            profile = request.user.profile

        return JsonResponse({"success": True, "score": profile.most_recent_game_score})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_highscore(request):
    try:
        user_id = request.GET.get("user_id")
        if user_id:
            try:
                profile = User.objects.get(id=user_id).profile
            except User.DoesNotExist:
                return JsonResponse({"success": False, "error": "User not found"}, status=404)
        else:
            profile = request.user.profile

        return JsonResponse({"success": True, "score": profile.highscore})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
