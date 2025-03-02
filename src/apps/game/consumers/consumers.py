import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
from django.core.exceptions import ValidationError
from channels.db import database_sync_to_async
from apps.game.models.game import GameRoom, GameConfig

def remap_player_data_by_position(game_state):
    position_mapped = {
        'score': {},
        'players': {},
        'settings': {
            'paddleSize': {},
            'paddleLoc': {},
        }
    }

    # Create mapping of position to player data
    for player_id, player_data in game_state['players'].items():
        position = player_data['position']
    
        # Map scores
        if player_id in game_state['score']:
            position_mapped['score'][position] = game_state['score'][player_id]
        
        # Map player info
        position_mapped['players'][position] = {
            'username': player_data['username'],
            'is_host': player_data['is_host']
        }
    
        # Map paddle settings
        if player_id in game_state['settings']['paddleSize']:
            position_mapped['settings']['paddleSize'][position] = game_state['settings']['paddleSize'][player_id]
        
        if player_id in game_state['settings']['paddleLoc']:
            position_mapped['settings']['paddleLoc'][position] = game_state['settings']['paddleLoc'][player_id]

    # Copy other game state data that doesn't need remapping
    position_mapped['is_playing'] = game_state['is_playing']
    position_mapped['powerUps'] = game_state['powerUps']
    position_mapped['pongLogic'] = game_state['pongLogic']

    return position_mapped

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
    active_games = {}
    game_room = None


    def get_player_count(self):
        return len(self.game_state['players'])
    # DB state
    # db_count = await database_sync_to_async(
    #     self.game_room.player_states.filter(is_active=True).count
    # )()

    async def connect(self):
        await super().connect()

        try:
            self.game_room = await database_sync_to_async(GameRoom.objects.get)(
                room_name=self.room_name
            )
            if not self.game_room:
                raise ValueError("Failed to create game_room")

            # room_status = await database_sync_to_async(self.get_room_status)()

            if self.room_name not in GameConsumer.active_games:
                GameConsumer.active_games[self.room_name] = self.create_initial_gamestate()

            self.game_state = GameConsumer.active_games[self.room_name]
            # if self.game_room.config.powerups_enabled:
            #     for powerup in self.game_room.config.powerup_list:
            #         self.game_state['powerUps'][powerup] = False

            join_result = await database_sync_to_async(self.game_room.join_game)(self.scope['user'])

            player_id = str(self.scope['user'].id)
            self.game_state['players'][player_id] = {
                'username': self.scope['user'].username,
                'position': join_result['side'],
                'is_host': join_result['is_host'],
                'is_ready': False
            }

            self.setup_player_paddle(player_id, join_result['side'])

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state_update',
                    'state': self.game_state
                }
            )
            await self.send(text_data=json.dumps({
                    'type': 'which_paddle',
                    'position': join_result['side']
             }))
            await self.send(json.dumps({
                   'type': 'connection successful',
                   'message': 'Connected to room'
               }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                 'type': 'error',
                 'message': str(e)
             }))

    def create_initial_gamestate(self):
        return {
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
                'ballSpeed': {'x': 0.2, 'y': 0.1},
                'ballSize': {'x': 1, 'y': 1},
                'lastWinner': None,
                'lastLoser': None,
            }
        }

    def setup_player_paddle(self, player, side):
        if side in ['left', 'right']:
            self.game_state['settings']['paddleSize'][player] = {'x': 1, 'y': 8}
            self.game_state['settings']['paddleLoc'][player] = {'position': 0, 'rotation': 0}
        else:
            self.game_state['settings']['paddleSize'][player] = {'x': 8, 'y': 1}
            self.game_state['settings']['paddleLoc'][player] = {'position': 0, 'rotation': 0}
        self.game_state['score'][player] = 0

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'paddle_move':
            await self.handle_paddle_move(data)
        elif message_type == 'player_ready':
            await self.handle_player_ready()
        elif message_type == 'start_game':
            await self.handle_start_game()
        elif message_type == 'set_ball_velocity':
            await self.handle_ball_velocity(data)
        elif message_type == 'set_paddle_size':
            await self.handle_paddle_size(data)
        elif message_type == 'toggle_powerup':
            await self.handle_toggle_powerup()
        elif message_type == 'update_score':
            await self.handle_update_score(data)
        elif message_type == 'reset_round':
            await self.handle_reset_round(data)
        elif message_type == 'game_over':
            await self.handle_game_over(data)

    async def handle_toggle_powerup(self, data):
        powerup_name = data.get('powerup')
        if powerup_name in self.game_state['powerUps']:
            self.game_state['powerUps'][powerup_name] = not self.game_state['powerUps'][powerup_name]
            await self.broadcast_game_state()

    async def handle_reset_round(self, data):
        player_id = str(self.scope['user'].id)
        if player_id in self.game_state['players']:
            self.game_state['pongLogic']['ballPos'] = {'x': 0, 'y': 0}
            self.game_state['pongLogic']['ballSpeed'] = {'x': 0, 'y': 0}
            self.game_state['pongLogic']['lastWinner'] = data['lastWinner']
            self.game_state['pongLogic']['lastLoser'] = data['lastLoser']
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'reset_round'
                }
            )
            await self.broadcast_game_state()
        

    async def handle_update_score(self, data):
        scoring_position = data.get('scoring_position')

        for player_id, player_data in self.game_state['players'].items():
            if player_data['position'] == scoring_position:
                self.game_state['score'][player_id] = self.game_state['score'].get(player_id, 0) + 1
                break
        await self.broadcast_game_state()

    async def handle_ball_velocity(self, data):
        player_id = str(self.scope['user'].id)
        if player_id in self.game_state['players']:
            self.game_state['pongLogic']['ballSpeed'] = {
                'x': data['x'],
                'y': data['y']
            }
            await self.broadcast_game_state()

    async def handle_paddle_size(self, data):
        player_id = str(self.scope['user'].id)
        if player_id in self.game_state['players']:
            self.game_state['pongLogic']['paddleSize'][player_id] = {
                'x': data['x'],
                'y': data['y'],
            }
            await self.broadcast_game_state()

    async def handle_paddle_move(self, data):
        player_id = str(self.scope['user'].id)
        if player_id in self.game_state['players']:

            self.game_state['settings']['paddleLoc'][player_id] = {
                'position': data['position'],
                'rotation': data['rotation']
            }
            await self.broadcast_game_state()

    async def handle_player_ready(self):
        try:
            all_ready = await database_sync_to_async(self.game_room.set_player_ready)(self.scope['user'])
            player_id = str(self.scope['user'].id)
            if player_id in self.game_state['players']:
                self.game_state['players'][player_id]['is_ready'] = True
                await self.broadcast_game_state()
            if all_ready:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'all_players_ready',
                        'value': all_ready
                    }
                )
        except Exception as e:
            await self.send(text_data=json.dumps({
                 'type': 'error',
                 'message': str(e)
             }))
    
    async def handle_start_game(self):
        player_id = str(self.scope['user'].id)
        player = self.game_state['players'].get(player_id)

        if not player or not player.get('is_host'):
            return

        room_status = await database_sync_to_async(self.game_room.get_room_status)()

        can_start = (
            len(room_status['players']) >= self.game_room.config.player_count
            and all(p['is_ready'] for p in room_status['players'])
        )

        if can_start:
            self.game_state['is_playing'] = True
            self.game_loop = asyncio.create_task(self.run_game_loop())
            await self.broadcast_game_state()
        else:
            await self.send(text_data=json.dumps({
                 'type': 'start_game_failed',
                 'reason': 'Not all players ready or insufficient players'
             }))

    async def handle_game_over(self, data):
        if not self.game_state['is_playing']:
            return

        winner_id = data.get('winner_id')
        if not winner_id:
            return
        self.game_state['is_playing'] = False

        try:
            await database_sync_to_async(self.game_room.save_game_result)(winner_id, self.game_state['score'])
            await self.broadcast_game_state(extra={
                'game_over': True,
                'winner': winner_id
            })
        except ValidationError as e:
            await self.send(text_data=json.dumps({
                 'type': 'error',
                 'message': str(e)
             }))

    async def disconnect(self, close_code):
        if hasattr(self, 'game_room'):
            player_id = str(self.scope['user'].id)
            if player_id in self.game_state['players']:
                del self.game_state['players'][player_id]
                del self.game_state['score'][player_id]
                if player_id in self.game_state['settings']['paddleSize']:
                    del self.game_state['settings']['paddleSize'][player_id]
                if player_id in self.game_state['settings']['paddleLoc']:
                    del self.game_state['settings']['paddleLoc'][player_id]

            if not self.game_state['players']:
                del GameConsumer.active_games[self.room_name]

            await database_sync_to_async(self.game_room.leave_game)(self.scope['user'])
            await self.broadcast_game_state()
        await super().disconnect(close_code)

    async def broadcast_game_state(self, extra=None):
        state_update = {
            'type': 'game_state_update',
            'state': self.game_state
        }
        if extra:
            state_update.update(extra)

        await self.channel_layer.group_send(
            self.room_group_name,
            state_update
        )

    async def run_game_loop(self):
        while self.game_state['is_playing']:
            self.game_state['pongLogic']['ballPos']['x'] += (self.game_state['pongLogic']['ballSpeed']['x'])
            self.game_state['pongLogic']['ballPos']['y'] += (self.game_state['pongLogic']['ballSpeed']['y'])
            await self.broadcast_game_state()
            await asyncio.sleep(1/60)
        

    async def game_state_update(self, event):
        if 'state' in event:
            game_state = event['state']
            for player_id, paddle_loc in game_state['settings']['paddleLoc'].items():
                if 'position' in paddle_loc:
                    paddle_loc['position'] = float(paddle_loc['position'])
                paddle_loc['rotation'] = float(paddle_loc.get('rotation', 0))

            position_mapped_state = remap_player_data_by_position(game_state)
            await self.send(text_data=json.dumps({
                'type': 'game_state_update',
                'state': position_mapped_state
            }))
        else:
            await self.send(text_data=json.dumps(event))

    async def chat_message(self, event):
        await self.send(text_data = json.dumps(event))

    async def player_update(self, event):
        await self.send(text_data = json.dumps(event))

    async def which_paddle(self, event):
        await self.send(text_data = json.dumps({
               'type': 'which_paddle',
               'position': event['position']
           }))
        
    async def started_game(self, event):
        await self.send(text_data = json.dumps(event))
    async def failed_to_start_game(self, event):
        await self.send(text_data = json.dumps(event))
    async def reset_round(self, event):
        await self.send(text_data = json.dumps(event))

    async def player_ready(self, event):
        await self.send(text_data = json.dumps(event))
    async def all_players_ready(self, event):
        await self.send(text_data = json.dumps(event))
        


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
    

