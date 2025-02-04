from django.contrib.auth.models import User
from .models import ScoreHistory
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction


@api_view(["POST"])
@login_required
def add_score(request):
    try:
        score = request.data.get("score")
        if score is None:
            return Response(
                {"success": False, "error": "Score is required"}, status=400
            )

        try:
            score = int(score)
        except ValueError:
            return Response(
                {"success": False, "error": "Score must be a number"}, status=400
            )

        profile = request.user.profile

        with transaction.atomic():
            score_history = profile.scores.create(score=score)
            profile.most_recent_game_score = score

            if score > profile.highscore:
                profile.highscore = score

            profile.save()

        return Response(
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
        return Response({"success": True, "error": str(e)}, status=500)


@api_view(["GET"])
@login_required
def get_score_history(request):
    try:
        user_id = request.GET.get("user_id")

        if user_id:
            try:
                profile = ScoreHistory.objects.get(id=user_id).profile
            except User.DoesNotExist:
                return Response(
                    {"success": False, "error": "User not found"}, status=404
                )
        else:
            profile = request.user.profile

        scores = profile.get_scores()
        score_list = [
            {
                "score": score.score,
                "date": score.created_at.isoformat(),
                "score_id": score.id,
            }
            for score in scores
        ]
        return Response({"success": True, "scores": score_list})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@login_required
def get_recent_score(request):
    try:
        user_id = request.GET.get("user_id")
        if user_id:
            try:
                profile = User.objects.get(id=user_id).profile
            except User.DoesNotExist:
                return Response(
                    {"success": False, "error": "User not found"}, status=404
                )
        else:
            profile = request.user.profile

        return Response({"success": True, "score": profile.most_recent_game_score})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@login_required
def get_highscore(request):
    try:
        user_id = request.GET.get("user_id")
        if user_id:
            try:
                profile = User.objects.get(id=user_id).profile
            except User.DoesNotExist:
                return Response(
                    {"success": False, "error": "User not found"}, status=404
                )
        else:
            profile = request.user.profile

        return Response({"success": True, "score": profile.highscore})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)
