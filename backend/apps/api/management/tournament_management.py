import json
import logging
from django.http import JsonResponse
from apps.game.models.tournament import Tournament
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.decorators import api_view

logger = logging.getLogger(__name__)

@api_view(['POST'])
def create_tournament(request):
	"""Create a new tournament"""
	try:
		data = json.loads(request.body)
		map_name = data.get('map', 'classic')

		 # Generate a tournament name
		import uuid
		name = f"tournament-{request.user.username}-{str(uuid.uuid4())[:5]}"
		
		# Use the Tournament.create class method instead of direct creation
		tournament = Tournament.create(
			name=name,
			creator=request.user,
			map=map_name
		)

		# Notify matchmaking system about the new tournament
		notify_new_tournament(tournament)

		logger.info(f"Tournament created: {tournament.name} by {request.user.username}")

		# Return the tournament data
		return JsonResponse({
			'id': tournament.id,
			'name': tournament.name,
			'map': tournament.map,
			'status': tournament.status,
			'players': tournament.players.count(),
			'max_players': tournament.player_count,
			'creator': {
				'id': tournament.creator.id,
				'username': tournament.creator.username
			}
		}, status=201)

	except Exception as e:
		logger.error(f"Failed to create tournament: {str(e)}")
		return JsonResponse({'error': str(e)}, status=400)

def notify_new_tournament(tournament):
	"""
	Notify matchmaking system about a new tournament
	"""
	try:
		channel_layer = get_channel_layer()

		# Send data to matchmaking channel group
		async_to_sync(channel_layer.group_send)(
			'matchmaking',
			{
				'type': 'room_created',
				'data': {
					'type': 'tournament',
					'id': tournament.id,
					'name': tournament.name,
					'map': tournament.map,
					'status': tournament.status,
					'players': tournament.players.count(),
					'max_players': tournament.player_count,
					'creator': {
						'id': tournament.creator.id,
						'username': tournament.creator.username
					}
				}
			}
		)

		logger.info(f"Sent tournament creation notification for tournament {tournament.id}")
	except Exception as e:
		logger.error(f"Failed to notify about new tournament: {str(e)}")
