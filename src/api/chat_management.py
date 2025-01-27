from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import ChatSerializer, MessageSerializer
import logging
from django.contrib.auth.decorators import login_required
from .models import Chat, Message



@api_view(['GET'])
@login_required
def get_chat_data(request):
    try:
        chat_id = request.GET.get('chat_id')
        
        if chat_id:
            chat = Chat.objects.get(
                id=chat_id, 
                participants=request.user
            )
            serializer = ChatSerializer(chat)
        else:
            chats = Chat.objects.filter(participants=request.user)
            serializer = ChatSerializer(chats, many=True)
        
        return Response(
            serializer.data,
            status=200,
            content_type='application/json'
        )
            
    except Chat.DoesNotExist:
        return Response(
            {"error": "Chat not found"}, 
            status=404
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=500
        )


