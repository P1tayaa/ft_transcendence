from django.urls import re_path
from .consumers.consumers import GameConsumer
from .consumers.chat_consumer import ChatConsumer
from .consumers.presence_consumer import PresenceConsumer
from .consumers.tournament_socket import TournamentConsumer
from .consumers.matchmaking import MatchmakingConsumer

websocket_urlpatterns = [
    re_path(r'ws/presence/$', PresenceConsumer.as_asgi()),
    re_path(r'ws/matchmaking/$', MatchmakingConsumer.as_asgi()),
    re_path(r'ws/game/(?P<room_name>[\w-]+)/$', GameConsumer.as_asgi()),
    re_path(r"ws/chat/(?P<chat_id>[\w-]+)/$", ChatConsumer.as_asgi()),
    re_path(r"ws/tournament/(?P<tournament_name>[\w-]+)/$", TournamentConsumer.as_asgi()),
]
