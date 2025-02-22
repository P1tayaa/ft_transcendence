from django.contrib.auth.models import User
from rest_framework.decorators import api_view 
from rest_framework import status
from django.contrib.auth import logout
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
import os
from PIL import Image
from io import BytesIO
from django.http import JsonResponse
import json
from rest_framework.response import Response


# User.objects.create_user should add to database itself
def create_user(user_data):
    try:
        user = User.objects.create_user(
            username=user_data["username"],
            email=user_data.get("email"),
            password=user_data["password"],
        )
        return True, user
    except Exception as e:
        return False, str(e)


@ensure_csrf_cookie
def register_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        # Use request.body instead of request.data
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        email = data.get("email")

        if not all([username, password]):
            return JsonResponse(
                {"success": False, "message": "Username and password are required."},
                status=400,
            )

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"success": False, "message": "Username already exists."}, status=400
            )

        user = User.objects.create_user(
            username=username, email=email if email else "", password=password
        )

        return JsonResponse(
            {
                "success": True,
                "message": "User registered successfully.",
                "username": user.username,
            }
        )

    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "message": "Invalid JSON data"}, status=400
        )
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@ensure_csrf_cookie
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        if not all([username, password]):
            return JsonResponse(
                {"success": False, "message": "Username and password are required."},
                status=400,
            )

        # authenticate() checks if username/password combination exists
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # login() creates the session
            login(request, user)
            return JsonResponse(
                {
                    "success": True,
                    "message": "Login successful",
                    "username": user.username,
                }
            )
        else:
            return JsonResponse(
                {"success": False, "message": "Invalid username or password."},
                status=401,
            )

    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "message": "Invalid JSON data"}, status=400
        )
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@ensure_csrf_cookie
@require_http_methods(["POST"])
def logout_user(request):
    try:
        logout(request)
        return JsonResponse(
            {
                "success": True,
                "message": "Succesfully logged out",
            }
        )
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@ensure_csrf_cookie
def check_auth_status(request):
    if request.user.is_authenticated:
        return JsonResponse(
            {
                "isAuthenticated": True,
                "username": request.user.username,
                "userId": request.user.id,
            }
        )
    else:
        return JsonResponse({"isAuthenticated": False})


# @login_requied
# def get_chat_data(request, chat_id=None):
#     profile = request.user.profile
#     print("test2")
#     if chat_id:
#         chat_data = profile.get_chat_history(
#             chat_id,
#             limit=int(request.GET.get("limit", 50)),
#             offset=int(request.GET.get("offset", 0)),
#         )
#         if not chat_data:
#             with open("test.txt", "a") as myfile:
#                 myfile.write("appended text")
#             return JsonResponse({"error": "Chat not found"}, status=404)
#     else:
#         with open("test.txt", "a") as myfile:
#             myfile.write("appended text")
#         chat_data = profile.get_all_chats()

#     with open("test.txt", "a") as myfile:
#         myfile.write("appended text")
#     return JsonResponse(chat_data, safe=False)


@api_view(["GET"])
@login_required
def get_current_user(request):
    user = request.user
    profile = user.profile
    return JsonResponse(
        {
            # user fields
            "username": user.username,
            "date_joined": user.date_joined.isoformat(),
            # profile fields
            "highscore": profile.highscore,
            # 'blabla' : usr.blabla
        }
    )


@api_view(["GET"])
def fetch_matching_usernames(request):
    try:
        search = request.GET.get("username", "")
        if not search:
            return Response(
                {"success": False, "error": "Username search term is required"},
                status=400,
            )

        matching_users = User.objects.filter(username__icontains=search).values(
            "id", "username"
        )

        results = [
            {"user_id": user["id"], "username": user["username"]}
            for user in matching_users
        ]

        return Response({"success": True, "results": results, "count": len(results)})
    except Exception as e:
        return Response(
            {
                "success": False,
                "error": str(e),
            },
            status=500,
        )


@api_view(["POST"])
def add_friend(request):
    try:
        friend_id = request.data.get("friend_id")
        print("Received friend_id:", friend_id, "type:", type(friend_id))  # Debug print

        if not friend_id:
            return Response({"error": "friend username is required"}, status=400)
        try:
            friend_id = int(friend_id)
        except ValueError:
            return Response({"success": False, "error": "Invalid friend id format"}, status=400)

        try:
            friend_user = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response({"error": f"User '{friend_id}' not found"}, status=404)

        if friend_id == request.user.id:
            return Response(
                {"success": False, "error": "Cannot add yourself as friend"}, status=400
            )

        friend_profile = friend_user.profile
        profile = request.user.profile

        if profile.is_friend(friend_profile):
            return Response(
                {
                    "success": False,
                    "error": f"Already friends with {friend_user.username}",
                },
                status=400,
            )

        friendship = profile.add_friend(friend_profile)

        return Response(
            {
                "message": f"Successfully added {friend_user.username} as friend",
                "friendship_id": friendship.id,
            },
            status=201,
        )

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(["GET"])
@login_required
def get_friends(request):
    try:
        profile = request.user.profile
        friendships = profile.get_friends()

        friend_list = []

        for friendship in friendships:
            friend_list.append({
                            "user_id": friendship.friend.user.id,
                            "username": friendship.friend.user.username,
                            "friendship_id": friendship.id,
                            "created_at": friendship.created_at.isoformat()
                       })
        return Response({"success": True, "friends": friend_list})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["POST"])
@login_required
def remove_friend(request):
    try:
        friend_id = request.data.get("friend_id")
        if not friend_id:
            return Response({"success": False, "error": "friend id is required"}, status=400)
        
        try:
            friend_id = int(friend_id)
        except ValueError:
            return Response({"success": False, "error": "Invalid friend id format"}, status=400)
            
        try:
            friend_user = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response({"success": False, "error": f"User not found"}, status=404)
            
        friend_profile = friend_user.profile
        profile = request.user.profile
        
        # delete() returns (number_deleted, dictionary_with_deletions)
        deleted_count, _ = profile.remove_friend(friend_profile)  # Unpack the tuple
        
        if deleted_count > 0:
            return Response({
                "success": True,
                "message": f"Successfully removed {friend_user.username} from friends"
            })
        else:
            return Response({
                "success": False,
                "error": f"No friendship found with {friend_user.username}"
            }, status=404)
            
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["POST"])
@login_required
def upload_profile_picture(request):
    if 'profile_picture' not in request.FILES:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    image = request.FILESi['profile_picture']
    if not image.content_type.startswith('image/'):
        return Response({'error': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        img = Image.open(image)
        max_size = (500, 500)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)


        output =BytesIO()
        img.save(output, format='PNG', quality=85)
        output.seek(0)

        request.user.profile.profile_picture.save(
            f'profile_pic.png',
            ContentFile(output.read()),
            save=True
        )

        return Response({
            'message': 'Profile picture updated successfully',
            'url': request.user.profile.get_profile_picture_url()
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        
api_view(["POST"])
@login_required
def delete_profile_picture(request):
    profile = request.user.profile
    if profile.profile_picture:
        if os.path.isfile(profile.profile_picture.path):
            os.remove(profile.profile_picture.path)
        profile.profile_picture = None
        profile.save()
    
    return Response({'message': 'Profile picture deleted successfully'})            
