import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from channels.db import database_sync_to_async
from apps.game.models.game import GameRoom, GameConfig
from apps.game.models.tournament import TournamentRoom
from django.contrib.auth.models import User

class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
        self.user = self.scope["user"]

        if not self.tournament_id:
            await self.close()
            return

        self.tournament = await self.get_tournament_object(self.tournament_id)

        if not self.tournament:
            await self.close()
            return

        self.group = f'tournament_{self.tournament_id}'

        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

        # send initial data
        await self.tournament_update()


    async def disconnect(self, close_code):
        if not hasattr(self, 'group'):
            return

        await self.channel_layer.group_discard(
            'tournament',
            self.channel_name
        )


    async def tournament_update(self, event):
        data = await self.get_tournament_data()
        await self.send(text_data=json.dumps({
             'type': 'tournament_update',
             'tournament_data': data
         }))


    @database_sync_to_async
    def get_tournament_object(self, tournament_id):
        return get_object_or_404(TournamentRoom, id=tournament_id)


    @database_sync_to_async
    def get_tournament_data(self):
        self.tournament.refresh_from_db()
        return self.tournament.get_tournament_data()