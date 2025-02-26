from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from ..serializers import ChatSerializer, MessageSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth.decorators import login_required
from apps.users.models import Chat, Message
from django.db import transaction


@api_view(["POST"])
@login_required
def add_message(request):
    try:
        content = request.data.get("content")
        recipient_id = request.data.get("recipient_id")
        chat_id = request.data.get("chat_id") # OPTIONAL, WILL CREATE CHAT IF NOT GIVEN

        if not content:
            return Response({"success": False, "error": "Message content is required"}, status=400)

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
                try:
                    chat = Chat.objects.get(id=chat_id, participants=request.user)
                except Chat.DoesNotExist:
                    return Response({"success": False, "error": "Chat not found"}, status=404)
            else:
                # create
                try:
                    recipient = User.objects.get(id=recipient_id)
                    chat = request.user.profile.get_chat_with(recipient)
                except User.DoesNotExist:
                    return Response({"success": False, "error": "Recipient not found"}, status=404)

            message = chat.messages.create(
                sender=request.user,
                content=content,
                is_read=False,
            )

            chat.save()

            message_data = {
                "id": message.id,
                "content": message.content,
                "sender": message.sender.username,
                "timestamp": message.timestamp.isoformat(),
                "is_read": message.is_read,
            }

            other_participants = chat.participants.exclude(id=request.user.id)
            chat_data = {
                "id": chat.id,
                "participants": list(other_participants.values("id", "username")),
                "sent_at": chat.sent_at.isoformat(),
            }

            channel_layer = get_channel_layer()
            for participant in other_participants:
                async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                    {
                        "type": "new_message",
                        "message": message_data,
                        "chat": chat_data
                    }
                )

            return Response({
                "success": True,
                "message": message_data,
                "chat": chat_data
            })

    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@login_required
def get_chats(request):
    try:
        chat_id = request.GET.get("chat_id")
        if chat_id:
            chat_data = request.user.profile.get_chat_history(
                chat_id,
                limit=int(request.GET.get("limit", 50)),
                offset=int(request.GET.get("offset", 0))
            )
            if not chat_data:
                return Response({"error": "Chat not found"}, status=404)
            return Response(chat_data)
        else:
            # Get all chats with latest messages
            chats = request.user.profile.get_all_chats()
            return Response({**chats})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
@login_required
def get_chat_history(request):
    try:
        user_id = request.GET.get("user_id")
        if user_id:
            try:
                other_participant = User.objects.get(id = user_id)
                chat = Chat.objects.filter(participants=request.user).filter(participants=other_participant).first()
                if not chat:
                    return Response({"error": "No chat history found with this user"}, status=404)

                chat_data = request.user.profile.get_chat_history(
                    chat.id,
                    limit=int(request.GET.get("limit", 50)),
                    offset=int(request.GET.get("offset", 0))
                )
                return Response(chat_data)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=404)
  except Exception as e:
    return Response({"error": str(e)}, status=500)
    

api_view(["POST"])
@login_required
def mark_messages_read(request):
    try:
        chat_id = request.data.get("chat_id")    
        if not chat_id:
            return Response({"success": False, "error": "Chat ID required"}, status=400)

        updated = request.user.profile.mark_messages_read(chat_id)
        return Response({"success": True, "messages_marked_read": updated})
    except Chat.DoesNotExist:
        return Response({"success": False, "error": "Chat not found"}, status=404)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["POST"])
@login_required
def update_typing_status(request):
    try:
        chat_id = request.data.get("chat_id")
        is_typing = request.data.get("is_typing", False)

        if not chat_id:
            return Response({"success": False, "error": "Chat ID required"}, status=400)

        chat = Chat.objects.get(id=chat_id, participant=request.user)

        #notify participants
        channel_layer = get_channel_layer()
        other_participants = chat.participants.exclude(id=request.user.id)

        for participant in other_participants:
            async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                {
                    "type": "typing_status",
                    "user": request.user.username,
                    "chat_id": chat_id,
                    "is_typing": is_typing
                }
            )
        return Response({"success": True})
    except Chat.DoesNotExist:
        return Response({"success": False, "error": "Chat not found"}, status=404)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)
            

    

