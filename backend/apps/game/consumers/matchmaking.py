import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from apps.game.models.game import GameRoom
from apps.game.models.tournament import Tournament

@database_sync_to_async
def get_game_rooms():
    # Get regular game rooms (exclude those associated with tournaments)
    game_rooms = GameRoom.objects.filter(status='waiting', tournament__isnull=True)
    tournaments = Tournament.objects.filter(status='waiting')
    
    # Prepare combined rooms list with type identifier
    rooms = []
    
    # Add regular game rooms
    for room in game_rooms:
        room_data = {
            'type': 'game',
            'name': room.name,
            'map': room.map,
            'players': room.players.count(),
            'max_players': room.player_count,
        }
        rooms.append(room_data)
    
    # Add tournaments
    for tournament in tournaments:
        tournament_data = {
            'type': 'tournament',
            'name': tournament.name,
            'map': tournament.map,
            'players': tournament.players.count(),
            'max_players': tournament.player_count,
        }
        rooms.append(tournament_data)
    
    return rooms

class MatchmakingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "matchmaking",
            self.channel_name
        )
        await self.accept()

        # Get combined rooms list
        rooms = await get_game_rooms()

        await self.send(json.dumps({
            'type': 'room_list',
            'rooms': rooms,
        }))


    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "matchmaking",
            self.channel_name,
        )


    async def room_created(self, event):
        await self.send(json.dumps({
            'type': 'room_created',
            'room': event['data'],
        }))
