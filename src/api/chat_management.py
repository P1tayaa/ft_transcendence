from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import ChatSerializer, MessageSerializer
import logging
from django.contrib.auth.decorators import login_required
from .models import Chat, Message
from django.db import transaction


@api_view(["POST"])
@login_required
def add_message(request):
    try:
        content = request.data.get("content")
        recipient_id = request.data.get("recipient_id")
        chat_id = request.data.get("chat_id")  # optional

        if not content:
            return Response(
                {"success": False, "error": "Message content is required"}, status=400
            )
        # if no chat id, need recipient_id to create
        if not chat_id and not recipient_id:
            return Response(
                {
                    "success": False,
                    "error": "Either chat id or recipient id is required",
                },
                status=400,
            )

        with transaction.atomic():
            if chat_id:
                # get existing chat
                try:
                    chat = request.user.chats.get(id=chat_id)
                except Chat.DoesNotExist:
                    return Response(
                        {"success": False, "error": "Chat not found"}, status=404
                    )
            else:
                # create with recipient
                try:
                    recipient = User.objects.get(id=recipient_id)
                except User.DoesNotExist:
                    return Response(
                        {"success": False, "error": "Recipient not found"}, status=404
                    )

                chat = request.user.profile.get_chat_with(recipient)

            message = chat.message.create(
                sender=request.user,
                content=content,
                is_read=False,
            )

        other_participant = chat.participants.exclude(id=request.user.id)

        return Response(
            {
                "success": True,
                "message": {
                    "id": message.id,
                    "content": message.content,
                    "sender": message.sender.username,
                    "timestamp": message.timestamp.isoformat(),
                    "is_read": message.is_read,
                },
                "chat": {
                    "id": chat.id,
                    "participants": list(other_participant.values("id", "username")),
                    "sent_at": chat.sent_at.isoformat(),
                },
            }
        )

    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@login_required
def get_chat_data(request):
    try:
        chat_id = request.GET.get("chat_id")

        if chat_id:
            chat = Chat.objects.get(id=chat_id, participants=request.user)
            serializer = ChatSerializer(chat)
        else:
            chats = Chat.objects.filter(participants=request.user)
            serializer = ChatSerializer(chats, many=True)

        return Response(serializer.data, status=200, content_type="application/json")

    except Chat.DoesNotExist:
        return Response({"error": "Chat not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
