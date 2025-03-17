from django.contrib.auth.models import User
from rest_framework.decorators import api_view 
from django.contrib.auth import update_session_auth_hash
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


def serialize_user(user_to_serialize, viewing_user=None):
    data = {
        "id": user_to_serialize.id,
        "username": user_to_serialize.username,
        "stats": {
            "highscore": user_to_serialize.profile.highscore,
            "most_recent_game_score": user_to_serialize.profile.most_recent_game_score,
        },
        "avatar": user_to_serialize.profile.get_profile_picture_url(),
    }

    if viewing_user and viewing_user != user_to_serialize:
        data["is_following"] = viewing_user.profile.is_following(user_to_serialize.profile)
    
    if viewing_user and viewing_user != user_to_serialize:
        data["is_blocking"] = viewing_user.profile.is_blocking(user_to_serialize.profile)

    return data


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
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        email = data.get("email")

        if not all([username, password]):
            return JsonResponse(
                {"success": False, "message": "Username and password are required."},
                status=400,
            )

        if User.objects.filter(username=username).exists():
            return JsonResponse(
                {"success": False, "message": "Username already exists."}, status=400
            )

        user = User.objects.create_user(
            username=username, email=email if email else "", password=password
        )

        # !INFO form must include enctype="multipart/form-data"
        if 'profile_picture' in request.FILES:
            image = request.FILES['profile_picture']
            if image.content_type.startswith('image/'):
                try:
                    img = Image.open(image)
                    max_size = (500, 500)
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    output = BytesIO()
                    img.save(output, format='PNG', quality=85)
                    output.seek(0)
                    user.profile.profile_picture.save(
                        f'profile_pic_{username}.png',
                        ContentFile(output.read()),
                        save=True
                    )
                except Exception as e:
                    print(f"Error saving profile picture: {str(e)}")
            else:
                return JsonResponse({"success": False, "message": "File must be an image"}, status=400)
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True,
                "message": "Successfully registered and login successfully",
                "username": username
            })
        else:
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

        user = authenticate(request, username=username, password=password)

        if user is not None:
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


@api_view(["GET"])
@login_required
def get_current_user(request):
    user = request.user
    return JsonResponse(
        {
            "success": True,
            **serialize_user(user)
        }
    )


@api_view(["GET"])
def fetch_matching_usernames(request):
    try:
        search = request.GET.get("username", "")
        if not search:
            return Response({"success": False, "error": "Username search term is required"}, status=400)

        matching_users = User.objects.filter(username__icontains=search).select_related('profile')
        results = [serialize_user(matching_user ,request.user) for matching_user in matching_users]

        return Response({
            "success": True,
            "results": results,
            "count": len(results)
        })

    except Exception as e:
        return Response({
                "success": False,
                "message": str(e),
            }, status=500,
        )



@api_view(["POST"])
def follow_user(request):
    try:
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"error": "user_id is required"}, status=400)
        try:
            user_id = int(user_id)
        except ValueError:
            return Response({"success": False, "error": "Invalid user id format"}, status=400)

        try:
            user_to_follow = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": f"User not found"}, status=404)

        if user_id == request.user.id:
            return Response({"error": "Cannot follow yourself"}, status=400)

        follower_profile = request.user.profile
        followed_profile = user_to_follow.profile
        if follower_profile.is_following(followed_profile):
            return Response({"success": False, "error": f"Already following {user_to_follow.username}"}, status=400)
        follow = follower_profile.follow_user(followed_profile)
        return Response({
            "success": True,
            "message": f"Successfully followed {user_to_follow.username}",
            "follow_id": follow.id
        }, status = 201)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(["GET"])
@login_required
def get_following(request):
    try:
        profile = request.user.profile
        following = profile.get_following()
        following_list = []

        for follow in following:
            following_list.append({**serialize_user(follow.followed.user, request.user)})

        return Response({
            "success": True,
            "following": following_list
        })
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)

@api_view(["GET"])
@login_required
def get_followers(request):
    try:
        profile = request.user.profile
        followers = profile.get_followers()
        followers_list = []

        for follow in followers:
            followers_list.append({**serialize_user(follow.followed.user)})

        return Response({
            "success": True,
            "followers": followers_list
        })
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)

@api_view(["POST"])
@login_required
def unfollow_user(request):
    try:
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"success": False, "message": "user_id is required"}, status=400)

        try:
            user_id = int(user_id)
        except ValueError:
            return Response({"success": False, "message": "Invalid user id format"}, status=400)

        try:
            user_to_unfollow = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"message": f"User not found"}, status=404)

        follower_profile = request.user.profile
        followed_profile = user_to_unfollow.profile

        deleted_count, _ = follower_profile.unfollow_user(followed_profile)
        if deleted_count > 0:
            return Response({
                "success": True,
                "message": f"Successfully unfollowed {user_to_unfollow.username}"
            })
        else:
            return Response({
                "success": False,
                "message": f"You are not following {user_to_unfollow.username}"
            }, status=404)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)



@api_view(["POST"])
@login_required
def upload_profile_picture(request):
    if 'profile_picture' not in request.FILES:
        return Response({'message': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    image = request.FILES['profile_picture']
    if not image.content_type.startswith('image/'):
        return Response({'message': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)

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
        return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        
@api_view(["POST"])
@login_required
def delete_profile_picture(request):
    profile = request.user.profile
    if profile.profile_picture:
        if os.path.isfile(profile.profile_picture.path):
            os.remove(profile.profile_picture.path)
        profile.profile_picture = None
        profile.save()
    
    return Response({'message': 'Profile picture deleted successfully'})

@api_view(["POST"])
@login_required
def change_username(request):
    data = json.loads(request.body)
    new_username = data.get('new_username')
    if not new_username:
        return JsonResponse({'success': False, 'message': 'new_username is required'}, status=400)
    
    # check if taken
    if User.objects.filter(username=new_username).exclude(id=request.user.id).exists():
        return JsonResponse({
            'status': 'error',
            'message': 'Username already exists'
        }, status=400)
    try:
        user = request.user
        user.username = new_username
        user.save()
        return JsonResponse({
            'success': True,
            'message': 'Username updated successfully',
            'username': new_username
        }, status=200)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
@api_view(["POST"])
@login_required
def change_password(request):
    data = json.loads(request.body)
    old_password = data.get('old_password')
    new_password1 = data.get('new_password1')
    new_password2 = data.get('new_password2')

    if not all([new_password1, new_password2, old_password]):
        return JsonResponse({'success': False, 'message': 'old and new_password are both required'}, status=400)
    
    if not request.user.check_password(old_password):
        return JsonResponse({'success': False, 'message': 'Old password does not match'}, status=400)
    if new_password1 != new_password2:
        return JsonResponse({'success': False, 'message': 'New passwords do not match'}, status=400)

    try:
        user = request.user
        user.set_password(new_password1)
        user.save()
        update_session_auth_hash(request, user)
        return JsonResponse({'success': True, 'message': 'Password successfully updated'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@api_view(["POST"])
@login_required
def block_user(request):
    try:
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"success": False, "message": "user_id is required"}, status=400)
        user_to_block = User.objects.get(id=user_id)
        profile_to_block = user_to_block.profile
        profile_blocking = request.user.profile

        if profile_blocking.is_blocking(profile_to_block):
            return Response({"success": False, "message": f"Already blocking {user_to_block.username}"}, status=400)
        block = profile_blocking.block_user(profile_to_block)
        return Response({
            "success": True,
            "message": f"Successfully blocked {user_to_block.username}",
            "follow_id": block.id
        }, status = 201)
    
    except Exception as e:
        return Response({'message': str(e)}, status=500)


@api_view(["POST"])
@login_required
def unblock_user(request):
    try:
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"success": False, "message": "user_id is required"}, status=400)

        try:
            user_to_unblock = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"message": f"User not found"}, status=404)

        unblocking_profile = request.user.profile
        unblocked_profile = user_to_unblock.profile

        deleted_count, _ = unblocking_profile.unblock_user(unblocked_profile)
        if deleted_count > 0:
            return Response({
                "success": True,
                "message": f"Successfully unfollowed {user_to_unblock.username}"
            })
        else:
            return Response({
                "success": False,
                "message": f"You are not following {user_to_unblock.username}"
            }, status=404)

    
    except Exception as e:
        return Response({'message': str(e)}, status=500)


@api_view(["GET"])
@login_required
def get_blocked(request):
    try:
        user_id = request.user.id
        if not user_id:
            return Response({"success": False, "message": "user_id is required"}, status=400)
        
        user = User.objects.get(id=user_id)
        profile = user.profile

        profile.get_blocking()
        
    except Exception as e:
        return Response({'message': str(e)}, status=500)
        
