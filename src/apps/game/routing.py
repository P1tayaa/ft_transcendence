from django.urls import re_path
from .consumers.consumers import GameConsumer, SpectatorConsumer

websocket_urlpatterns = [
    re_path(r'ws/room/(?P<room_name>\w+)/$', GameConsumer.as_asgi()),
    re_path(r'ws/spectate/(?P<room_name>\w+)/$', SpectatorConsumer.as_asgi()),
]
