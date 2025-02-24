from django.urls import re_path
from .consumers.consumers import GameConsumer, SpectatorConsumer
from .consumers.chat_consumer import ChatConsumer
from .consumers.status_consumer import PresenceConsumer
from .models.matchmaking import MatchmakingConsumer

websocket_urlpatterns = [
    re_path(r'ws/presence/$', PresenceConsumer.as_asgi()),
    re_path(r'ws/room/(?P<room_name>\w+)/$', GameConsumer.as_asgi()),
    re_path(r'ws/spectate/(?P<room_name>\w+)/$', SpectatorConsumer.as_asgi()),
    re_path(r'ws/matchmaking/$', MatchmakingConsumer.as_asgi()),
    re_path(r"ws/chat/$", ChatConsumer.as_asgi()),
]
