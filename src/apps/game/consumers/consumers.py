import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
from django.core.exceptions import ValidationError
from channels.db import database_sync_to_async
from apps.game.models.game import GameRoom, GameConfig

class BaseConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'room_{self.room_name}'
    
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

class GameConsumer(BaseConsumer):
    game_room = None
    async def connect(self):
        await super().connect()

        try :
            config = await database_sync_to_async(GameConfig.objects.first)()
            if not config:
                config = await database_sync_to_async(GameConfig.objects.create)(
                    mode='networked',
                    server_url='',
                    powerups_enabled=False,
                    powerup_list=[],
                    player_count=4,
                    map_style='classic',
                    player_sides=['left', 'right', 'top', 'bottom'],
                    bots_enabled=False,
                    bot_sides=['top'],
                    is_host=True,
                    spectator_enabled=False
                )
            self.game_room, created = await database_sync_to_async(GameRoom.objects.get_or_create)(
                room_name=self.room_name,
                defaults = {
                    'config': await database_sync_to_async(GameConfig.objects.first)(),  # Use a default config
                    'status': 'WAITING',
                    'is_active': True
                }
            )
            if not self.game_room:
                raise ValueError("Failed to create game_room")
            await database_sync_to_async(self.game_room.join_game)(self.scope['user'])
            await self.send(text_data=json.dumps({
                    'type': 'connection_successful',
                    'message': 'connected to room'
                }))
        except ValidationError as e:
            await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': str(e),
                }))
            await self.close()
        except GameRoom.DoesNotExist:
            await self.close()
            return
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': str(e),
                'message': 'Failed to connect to room'
             }))
            await self.close()

        self.game_state = {
            'score': {},
            'players': {},
            'is_playing': False,
            'settings': {
                'paddleSize': {},
                'paddleLoc': {},
            },
            'powerUps': {},
            'pongLogic': {
                'ballPos': {'x': 0, 'y': 0},
                'ballSpeed': 5,
                'ballSize': 10,
                'lastWinner': None,
                'lastContact': None,
                'lastLoser': None,
            }
        }

        # new player
        player_id = str(self.scope['user'].id)
        player_count = len(self.game_state['players'])
        is_host = player_count == 0

        # position
        available_positions = await database_sync_to_async(self.game_room.config.player_sides.copy)()
        used_positions = set(p['position'] for p in self.game_state['players'].values() if 'position' in p)
        position = next(pos for pos in available_positions if pos not in used_positions)

        self.game_state['players'][player_id] = {
            'username': self.scope['user'].username,
            'is_host': is_host,
            'position': position
        }

        # paddle for player
        self.game_state['settings']['paddleLoc'][player_id] = {
            'y': 0,
            'rotation': 0
        }

        #score for player
        self.game_state['score'][player_id] = 0

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_update',
                'players': self.game_state['players']
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'game_room'):
            await database_sync_to_async(self.game_room.leave_game)(self.scope['user'])
        await super().disconnect(close_code)
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'gameState':
            # update settings
            player_id = str(self.scope['user'].id)
            if player_id in self.game_state['players'] and self.game_state['players'][player_id]['is_host']:
                if 'pongLogic' in data:
                    self.game_state['pongLogic'].update(data['pongLogic'])
                if 'settings' in data:
                    # merge and preserve paddle loc
                    # current_paddle_loc = self.game_state['settings']['paddleLoc']
                    self.game_state['settings'].update(data['settings'])
                    # self.game_state['settings']['paddleLoc']. = current_paddle_loc
                if 'powerUps' in data:
                    self.game_state['powerUps'] = data['powerUps']
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state_update',
                        'state': self.game_state
                    }
                )

        elif message_type == 'which_paddle':
            player_id = str(self.scope['user'].id)
            if player_id in self.game_state['players']:
                position = self.game_state['players'][player_id]['position']
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'which_paddle',
                        'position': position,
                    }
                )
            else:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'error',
                        'message': 'Player not found in game',
                    }
                )
            
        elif message_type == 'paddle_move':
            player_id = str(self.scope['user'].id)
            if player_id in self.game_state['players']:
                if self.game_state['players'][player_id]['position'] == 'left' or 'right':
                    self.game_state['settings']['paddleLoc'][player_id] = {
                        'y': data['position'],
                        'rotation': data['rotation']
                    }
                else:
                    self.game_state['settings']['paddleLoc'][player_id] = {
                        'x': data['position'],
                        'rotation': data['rotation']
                    }
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state_update',
                        'state': self.game_state
                    }
                )
               
        elif message_type == 'chat_message':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'username': self.scope['user'].username,
                    'message': data['message']
                }
            )

        # elif message_type == 'is_playing':
        #     await self.channel_layer.group_send(
        #         self.room_group_name,
        #         {
        #             'type': 'is_playing',
        #             'value': self.
        #         }
        #     )

        elif message_type == 'start_game':
            player_id = str(self.scope['user'].id)
            if player_id in self.game_state['players'] \
                and self.game_state['players'][player_id]['is_host'] \
                and len(self.game_state['players']) >= self.game_room.config.player_count \
                and not self.game_state['is_playing']:
                self.game_state['is_playing'] = True
                self.game_loop = asyncio.create_task(self.run_game_loop())

        elif message_type == 'game_over':
            winner_id = data.get('winner_id')
            if winner_id and self.game_state['is_playing']:
                self.game_state['is_playing'] = False
                # update database
                await database_sync_to_async(self.game_room.complete_game)(
                    winner_id=winner_id,
                    scores=self.game_state['score']
                )
                # notify players
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state_update',
                        'state': self.game_state,
                        'game_over': True,
                        'winner': winner_id
                    }
                )


    async def run_game_loop(self):
        while self.game_state['is_playing']:
            self.game_state['pongLogic']['ballPos']['x'] += self.game_state['pongLogic']['ballSpeed']
            self.game_state['pongLogic']['ballPos']['y'] += self.game_state['pongLogic']['ballSpeed']

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state_update',
                    'state': self.game_state
                }
            )

            asyncio.sleep(1/60) # apparently for 60 fps

    async def game_state_update(self, event):
        await self.send(text_data = json.dumps(event))

    async def chat_message(self, event):
        await self.send(text_data = json.dumps(event))

    async def player_update(self, event):
        await self.send(text_data = json.dumps(event))

    async def which_paddle(self, event):
        await self.send(text_data = json.dumps({
                           'type': 'which_paddle',
                           'position': event['position']
                       }))

class SpectatorConsumer(BaseConsumer):
    async def connect(self):
        await super().connect()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'spectator_join',
                'username': self.scope['user'].username
            }
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        # can send chats
        if message_type == 'chat_message':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'username': f"[Spectator] {self.scope['user'].username}",
                    'message': data['message']
                }
            )

    async def game_state_update(self, event):
        await self.send(text_data = json.dumps(event))

    async def chat_message(self, event):
        await self.send(text_data = json.dumps(event))

    async def player_update(self, event):
        await self.send(text_data = json.dumps(event))

    async def spectator_join(self, event):
        await self.send(text_data = json.dumps(event))
