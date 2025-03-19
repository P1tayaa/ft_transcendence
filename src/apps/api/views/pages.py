from django.shortcuts import render
from django.contrib.auth.decorators import login_required

# pattern for single page application
@login_required(login_url='/login/')
def home(request):
    return render(request, "base.html", {"template_name": "pages/home.html"})

@login_required(login_url='/login/')
def game(request, name = None):
    context = {
        "template_name": "pages/gameplay.html",
    }

    if name:
        context["name"] = name

    return render(request, "base.html", context)


def register(request):
    return render(request, "base.html", {"template_name": "pages/register.html"})


def profile(request):
    return render(request, "base.html", {"template_name": "pages/profile.html"})


def lobby(request):
    return render(request, "base.html", {"template_name": "pages/lobby.html"})


def social(request):
    return render(request, "base.html", {"template_name": "pages/social.html"})


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

def gameSpectate(request):
    return render(request, "base.html", {"template_name": "pages/Spectate.html"})

def joinGame(request):
    return render(request, "base.html", {"template_name": "pages/joinGame.html"})

def tournament(request, id = None):
    context = {
        "template_name": "pages/tournament.html",
    }

    if id:
        context["tournament_id"] = id

    return render(request, "base.html", context)

def gameOver(request):
    return render(request, "base.html", {"template_name": "pages/gameOver.html"})