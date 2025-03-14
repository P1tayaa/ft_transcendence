"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.conf.urls.static import static
from django.urls import path, include
import os
from django.http import FileResponse, Http404
from django.conf import settings
from urllib.parse import urlparse, unquote
from apps.api.views.pages import (
    home,
    game,
    profile,
    social,
    lobby,
    login,
    friendlist,
    dashboard,
    register,
    configGame,
    gameStarting,
    gameSpectate,
    gameOver,
    tournament,
    joinGame
)


def serve_frontend(request, filename="index.html"):
    # Decode and clean the filename
    decoded_path = unquote(urlparse(filename).path)

    # Path to the frontend directory
    frontend_path = os.path.join(settings.BASE_DIR, "frontend")

    # Construct the full file path
    file_path = os.path.normpath(os.path.join(frontend_path, decoded_path))

    # Ensure the file path is within the frontend directory
    if not file_path.startswith(frontend_path):
        raise Http404("File not found")

    # Serve the file if it exists
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(open(file_path, "rb"))
    else:
        raise Http404("File not found")


# this pattern to serve single page application
urlpatterns = [
    path("api/", include("apps.api.urls")),  # API endpoints
    path("", home, name="home"),
    path("game/", game, name="game"),
    path("profile/", profile, name="profile"),
    path("social/", social, name="social"),
    path("lobby/", lobby, name="lobby"),
    path("login/", login, name="login"),
    path("friendlist/", friendlist, name="friendlist"),
    path("dashboard/", dashboard, name="dashboard"),
    path("register/", register, name="register"),
    path("configGame/", configGame, name="configGame"),
    path("gameStarting/", gameStarting, name="gameStarting"),

    path("gameSpectate/",gameSpectate, name="gameSpectate"),

    path("gameOver/",gameOver, name="gameOver"),
    path("joinGame/",joinGame, name="joinGame"),
    path("tournament/", tournament, name="tournament"),
    path("tournament/<int:id>/", tournament, name="tournament"),
    # ... other paths
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
