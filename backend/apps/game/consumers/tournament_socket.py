import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from channels.db import database_sync_to_async
from apps.game.models import GameRoom, GameConfig, TournamentRoom
from django.contrib.auth.models import User

class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
        self.user = self.scope["user"]

        await self.channel_layer.group_add(
            'tournament',
            self.channel_name
        )
        await self.accept()

        # send initial data
        if self.tournament_id:
            tournament_data = await self.get_tournament_data(self.tournament_id)
            await self.send(json.dumps({
                'type': 'tournament_data',
                'tournament': tournament_data
            }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            'tournament',
            self.channel_name
        )


    async def tournament_update(self, event):
        await self.send(text_data=json.dumps({
             'type': 'tournament_update',
             'tournament_data': event['tournament_data']
         }))



    @database_sync_to_async
    def get_tournament_data(self, tournament_id):
        """Get complete data for a specific tournament"""
        tournament = get_object_or_404(TournamentRoom, id=tournament_id)
    
        return {
            'id': tournament.id,
            'name': tournament.tournament_name,
            'status': tournament.status,
            'creator': tournament.creator.username if tournament.creator else None,
            'max_participants': tournament.max_participants,
            'participants': [{
                'id': p.player.id,
                'username': p.player.username,
                'is_active': p.is_active,
                'eliminated': p.eliminated
            } for p in tournament.participants.all()],
            'matches': [{
                'id': m.id,
                'round_number': m.round_number,
                'match_number': m.match_number,
                'room_name': m.room_name,
                'status': m.status,
                'players': [{
                    'id': ps.player.id,
                    'username': ps.player.username,
                    'score': ps.score
                } for ps in m.player_states.all()]
            } for m in tournament.tournament_matches.all()],
            'standings': [{
                'player': s.player.username,
                'matches_played': s.matches_played,
                'wins': s.wins,
                'losses': s.losses,
                'points': s.points
            } for s in tournament.get_standings()]
        }
