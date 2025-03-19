from django.shortcuts import render
from django.middleware.csrf import get_token
import os
from rest_framework.decorators import api_view


# pattern for single page application
def spa_entry(request, path=None):
    context = {
        'csrf_token': get_token(request),
    }
    if request.user.is_authenticated:
        context['user_data'] = {
            'username': request.user.username,
            'is_authenticated': True,
        }
    return render(request, "base.html", context)

# def home(request):
#     return render(request, "base.html", {"template_name": "pages/home.html"})


# def game(request):
#     return render(request, "base.html", {"template_name": "pages/gameplay.html"})


# def register(request):
#     return render(request, "base.html", {"template_name": "pages/register.html"})


# def profile(request):
#     return render(request, "base.html", {"template_name": "pages/profile.html"})


# def lobby(request):
#     return render(request, "base.html", {"template_name": "pages/lobby.html"})


# def social(request):
#     return render(request, "base.html", {"template_name": "pages/social.html"})


# def friendlist(request):
#     return render(request, "base.html", {"template_name": "pages/friendList.html"})


# def login(request):
#     return render(request, "base.html", {"template_name": "pages/login.html"})


# def dashboard(request):
#     return render(request, "base.html", {
#                   "template_name": "pages/dashboard.html",
#                   "username": request.user.username,
#               })


# def configGame(request):
#     return render(request, "base.html", {"template_name": "pages/configGame.html"})


# def gameStarting(request):
#     return render(request, "base.html", {"template_name": "pages/gameStarting.html"})

# def gameSpectate(request):
#     return render(request, "base.html", {"template_name": "pages/Spectate.html"})

# def joinGame(request):
#     return render(request, "base.html", {"template_name": "pages/joinGame.html"})

# def tournament(request, id = None):
#     context = {
#         "template_name": "pages/tournament.html",
#     }

#     if id:
#         context["tournament_id"] = id

#     return render(request, "base.html", context)

# def gameOver(request):
#     return render(request, "base.html", {"template_name": "pages/gameOver.html"})
