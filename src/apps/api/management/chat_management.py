from rest_framework.decorators import api_view
from django.http import JsonResponse
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from apps.users.models import Chat, Message
from django.db import transaction


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_message(request):
    try:
        content = request.data.get("content")
        recipient_id = request.data.get("recipient_id")

        if not content:
            return JsonResponse({"success": False, "error": "Message content is required"}, status=400)
        if not recipient_id:
            return JsonResponse({"success": False, "error": "recipient_id is required"}, status=400)
        if recipient_id == request.user.id:
            return JsonResponse({"success": False, "error": "Can't chat to yourself"}, status=400)
            

        with transaction.atomic():
            try:
                recipient = User.objects.get(id=recipient_id)
                chat = request.user.profile.get_or_create_chat_with(recipient)

            except User.DoesNotExist:
                return JsonResponse({"success": False, "error": "Recipient not found"}, status=404)

            message = chat.messages.create(
                sender = request.user,
                content = content,
                is_read = False,
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

            chat_participants = chat.participants.all()
            channel_layer = get_channel_layer()
            for participant in chat_participants:
                async_to_sync(channel_layer.group_send)(
                f"user_{participant.id}",
                    {
                        "type": "new_message",
                        "message": message_data,
                        "chat": chat_data,
                        "chat_id": chat.id
                    }
                )

            return JsonResponse({
                "success": True,
                "message": message_data,
                "chat": chat_data
            })

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_chat_history(request):
    try:
        user_id = request.GET.get("user_id")
        if user_id:
            try:
                other_participant = User.objects.get(id = user_id)
                chat = request.user.profile.get_or_create_chat_with(other_participant)

                chat_data = request.user.profile.get_chat_history(chat.id)
                return JsonResponse(chat_data)
            except User.DoesNotExist:
                return JsonResponse({"message": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_messages_read(request):
    try:
        chat_id = request.data.get("chat_id")    
        if not chat_id:
            return JsonResponse({"success": False, "error": "Chat ID required"}, status=400)

        updated = request.user.profile.mark_messages_read(chat_id)
        return JsonResponse({"success": True, "messages_marked_read": updated})
    except Chat.DoesNotExist:
        return JsonResponse({"success": False, "error": "Chat not found"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_typing_status(request):
    try:
        chat_id = request.data.get("chat_id")
        is_typing = request.data.get("is_typing", False)

        if not chat_id:
            return JsonResponse({"success": False, "error": "Chat ID required"}, status=400)

        chat = Chat.objects.get(id=chat_id, participants=request.user)

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
        return JsonResponse({"success": True})
    except Chat.DoesNotExist:
        return JsonResponse({"success": False, "error": "Chat not found"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
            

    

