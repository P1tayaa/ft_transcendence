import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio


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
    async def connect(self):
        await super().connect()

        self.game_state = {
            'balls_pos': {'x': 0, 'y': 0},
            'ball_velocity': {'x': 5, 'y': 5},
            'paddles': {},
            'score': {},
            'players': {},
            'is_playing': False,
            'settings': {
                'paddleSize': {},
                'paddleLoc': {},
            },
            'powerUps': {},
            'pongLogic': {
                'ballSpeed': 5,
                'ballSize': 10,
                'lastWinner': None,
                'lastContact': None,
                'lastLoser': None,
            }
        }

        # new player
        player_id = self.scope['user'].id
        player_count = len(self.game_state['players'])
        is_host = player_count == 0

        # position
        position = 'left' # default for first player
        if player_count == 1:
            position = 'right'
        elif player_count == 2:
            position = 'top'
        elif player_count == 3:
            position = 'bottom'

        self.game_state['players'][player_id] = {
            'username': self.scope['user'].username,
            'is_host': is_host,
            'position': position
        }

        # paddle for player
        self.game_state['paddles'][player_id] = {
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
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'gameState':
            # update settings
            player_id = self.scope['user'].id
            if player_id in self.game_state['players'] and self.game_state['players'][player_id]['is_host']:
                if 'pongLogic' in data:
                    self.game_state['pongLogic'].update(data['pongLogic'])
                    # update ball speed
                    speed = data['pongLogic'].get('ballSpeed', self.game_state['ball_velocity']['x'])
                    self.game_state['ball_velocity'] = {'x': speed, 'y': speed}
                if 'settings' in data:
                    self.game_state['settings'].update(data['settings'])
                if 'powerUps' in data:
                    self.game_state['powerUps'] = data['powerUps']
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state_update',
                        'state': self.game_state
                    }
                )

        elif message_type == 'paddle_move':
            player_id = self.scope['user'].id
            if player_id in self.game_state['players']:
                is_player1 = self.game_state['players'][player_id]['is_player1']
                paddle_key = 'paddle1_pos' if is_player1 else 'paddle2_pos'
                self.game_state[paddle_key] = {
                    'y': data['position'],
                    'rotation': data['rotation']
                }
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state_update',
                        'state': self.game_state
                    }
                )
               
        elif message_type == 'chat_messsage':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'username': self.scope['user'].username,
                    'message': data['message']
                }
            )

        elif message_type == 'start_game':
            if len(self.game_state['players']) == 2 and not self.game_state['is_playing']:
                self.game_state['is_playing'] = True
                self.game_loop = asyncio.create_task(self.run_game_loop())

    async def run_game_loop(self):
        while self.game_state['is_playing']:
            self.game_state['balls_pos']['x'] += self.game_state['ball_velocity']['x']
            self.game_state['balls_pos']['y'] += self.game_state['ball_velocity']['y']

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
