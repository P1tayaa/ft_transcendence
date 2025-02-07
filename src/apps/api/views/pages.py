from django.shortcuts import render
import os
from rest_framework.decorators import api_view


# pattern for single page application
def home(request):
    return render(request, "base.html", {"template_name": "pages/home.html"})


def game(request):
    return render(request, "base.html", {"template_name": "pages/gameplay.html"})


def register(request):
    return render(request, "base.html", {"template_name": "pages/register.html"})


def profile(request):
    return render(request, "base.html", {"template_name": "pages/profile.html"})


def chat(request):
    return render(request, "base.html", {"template_name": "pages/chat.html"})


def friendlist(request):
    return render(request, "base.html", {"template_name": "pages/friendList.html"})


def login(request):
    return render(request, "base.html", {"template_name": "pages/login.html"})


def dashboard(request):
    return render(request, "base.html", {
                  "template_name": "pages/dashboard.html",
                  "username": request.user.username,
              })


def configGame(request):
    return render(request, "base.html", {"template_name": "pages/configGame.html"})


def gameStarting(request):
    return render(request, "base.html", {"template_name": "pages/gameStarting.html"})


# @api_view(["POST"])
# def create_profile(request):
#     data = request.data
#     # Process the data here
#     return Response({"status": "Profile created", "data": data})
