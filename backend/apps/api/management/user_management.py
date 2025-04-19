from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth import authenticate
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.permissions import AllowAny
from django.http import JsonResponse
from io import BytesIO
from PIL import Image
import os
import json



def serialize_user(user, viewer):
    data = {
        "id": user.id,
        "username": user.username,
        "avatar": user.profile.get_profile_picture_url(),
    }

    if viewer != user:
        data["is_following"] = viewer.profile.is_following(user.profile)
        data["is_blocking"] = viewer.profile.is_blocking(user.profile)
    else:
        following = user.profile.get_following()
        data["following"] = [serialize_user(follow.followed.user, viewer) for follow in following]

        followers = user.profile.get_followers()
        data["followers"] = [serialize_user(follow.follower.user, viewer) for follow in followers]

    return data



# User.objects.create_user should add to database itself
def create_user(user_data):
    try:
        user = User.objects.create_user(
            username=user_data["username"],
            password=user_data["password"],
        )
        return True, user
    except Exception as e:
        return False, str(e)


@ensure_csrf_cookie
@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    try:
        username = request.POST.get("username")
        password = request.POST.get("password")

        if not all([username, password]):
            return JsonResponse({"success": False, "message": "Username and password are required."},status=status.HTTP_400_BAD_REQUEST)

        # try:
        #     validate_password(password, request.user)
        # except ValidationError as e:
        #     return JsonResponse({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "message": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username, password=password
        )

        user = authenticate(request, username=username, password=password)
        token = str(AccessToken.for_user(user))

        if user is None:
            return JsonResponse({"success": False, "message": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)

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
                    # Continue with login process even if there's an error saving the profile picture
                    print(f"Error saving profile picture: {str(e)}")
            else:
                # Continue with login process even if file is not an image
                print("Uploaded file is not an image, skipping profile picture update")

        return JsonResponse({
            'success': True,
            "message": "Successfully registered and login",
            "user": serialize_user(user, user),
            "token": token
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@ensure_csrf_cookie
@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    try:
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(request, username=username, password=password)

        if user is None:
            return JsonResponse({"success": False, "message": "Invalid username or password.", "Provided": {"username": username, "password": password}}, status=status.HTTP_401_UNAUTHORIZED)

        token = str(AccessToken.for_user(user))

        return JsonResponse({
            "success": True,
            "message": "Login successful",
            "user": serialize_user(user, user),
            "token": token
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@ensure_csrf_cookie
@api_view(["POST"])
def logout_user(request):
    try:
        return JsonResponse({
            "success": True,
            "message": "Succesfully logged out",
        })
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
def get_current_user(request):
    user = request.user
    return JsonResponse(
        {
            "success": True,
            "user": serialize_user(user, request.user),
        }
    )



@api_view(["GET"])
def get_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        if not user:
            return JsonResponse({"success": False, "message": "User not found"}, status=404)

        return JsonResponse({
            "success": True,
            "user": serialize_user(user, request.user),
        })
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)



@api_view(["GET"])
def fetch_matching_usernames(request):
    try:
        search = request.GET.get("username", "")
        if not search:
            return JsonResponse({"success": False, "error": "Username search term is required"}, status=400)

        matching_users = User.objects.filter(username__icontains=search).exclude(id=request.user.id).select_related('profile')
        results = [serialize_user(matching_user ,request.user) for matching_user in matching_users]

        return JsonResponse({
            "success": True,
            "results": results,
            "count": len(results)
        })

    except Exception as e:
        return JsonResponse({
                "success": False,
                "message": str(e),
            }, status=500,
        )



@api_view(["POST"])
def follow_user(request):
    try:
        user_id = request.data.get("user_id")
        if not user_id:
            return JsonResponse({"error": "user_id is required"}, status=400)
        try:
            user_id = int(user_id)
        except ValueError:
            return JsonResponse({"success": False, "error": "Invalid user id format"}, status=400)

        try:
            user_to_follow = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        if user_id == request.user.id:
            return JsonResponse({"error": "Cannot follow yourself"}, status=400)

        follower_profile = request.user.profile
        followed_profile = user_to_follow.profile
        if follower_profile.is_following(followed_profile):
            return JsonResponse({"success": False, "error": f"Already following {user_to_follow.username}"}, status=400)
        follow = follower_profile.follow_user(followed_profile)
        return JsonResponse({
            "success": True,
            "message": f"Successfully followed {user_to_follow.username}",
            "follow_id": follow.id
        }, status = 201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@api_view(["GET"])
def get_following(request):
    try:
        profile = request.user.profile
        following = profile.get_following()
        following_list = []

        for follow in following:
            following_list.append(serialize_user(follow.followed.user, request.user))

        return JsonResponse({
            "success": True,
            "following": following_list
        })
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@api_view(["GET"])
def get_followers(request):
    try:
        profile = request.user.profile
        followers = profile.get_followers()
        followers_list = []

        for follow in followers:
            followers_list.append(serialize_user(follow.followed.user, request.user))

        return JsonResponse({
            "success": True,
            "followers": followers_list
        })
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)

@api_view(["POST"])
def unfollow_user(request):
    try:
        user_id = request.data.get("user_id")
        if not user_id:
            return JsonResponse({"success": False, "message": "user_id is required"}, status=400)

        try:
            user_id = int(user_id)
        except ValueError:
            return JsonResponse({"success": False, "message": "Invalid user id format"}, status=400)

        try:
            user_to_unfollow = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"message": "User not found"}, status=404)

        follower_profile = request.user.profile
        followed_profile = user_to_unfollow.profile

        deleted_count, _ = follower_profile.unfollow_user(followed_profile)
        if deleted_count > 0:
            return JsonResponse({
                "success": True,
                "message": f"Successfully unfollowed {user_to_unfollow.username}"
            })
        else:
            return JsonResponse({
                "success": False,
                "message": f"You are not following {user_to_unfollow.username}"
            }, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)



@api_view(["POST"])
def upload_profile_picture(request):
    if 'profile_picture' not in request.FILES:
        return JsonResponse({'message': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    image = request.FILES['profile_picture']
    if not image.content_type.startswith('image/'):
        return JsonResponse({'message': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)

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

        return JsonResponse({
            'message': 'Profile picture updated successfully',
            'url': request.user.profile.get_profile_picture_url()
        })
    except Exception as e:
        return JsonResponse({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        
@api_view(["POST"])
def delete_profile_picture(request):
    profile = request.user.profile
    if profile.profile_picture:
        if os.path.isfile(profile.profile_picture.path):
            os.remove(profile.profile_picture.path)
        profile.profile_picture = None
        profile.save()
    
    return JsonResponse({'message': 'Profile picture deleted successfully'})

@api_view(["POST"])
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
        validate_password(new_password1, request.user)
    except ValidationError as e:
        return JsonResponse({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


    try:
        user = request.user
        user.set_password(new_password1)
        user.save()
        return JsonResponse({
            'success': True,
            'message': 'Password successfully updated',
        }, status=200)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@api_view(["POST"])
def block_user(request):
    try:
        user_id = request.data.get("user_id")
        if not user_id:
            return JsonResponse({"success": False, "message": "user_id is required"}, status=400)
        user_to_block = User.objects.get(id=user_id)
        profile_to_block = user_to_block.profile
        profile_blocking = request.user.profile

        if profile_blocking.is_blocking(profile_to_block):
            return JsonResponse({"success": False, "message": f"Already blocking {user_to_block.username}"}, status=400)
        block = profile_blocking.block_user(profile_to_block)
        return JsonResponse({
            "success": True,
            "message": f"Successfully blocked {user_to_block.username}",
            "follow_id": block.id
        }, status = 201)
    
    except Exception as e:
        return JsonResponse({'message': str(e)}, status=500)


@api_view(["POST"])
def unblock_user(request):
    try:
        user_id = request.data.get("user_id")
        if not user_id:
            return JsonResponse({"success": False, "message": "user_id is required"}, status=400)

        try:
            user_to_unblock = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"message": "User not found"}, status=404)

        unblocking_profile = request.user.profile
        unblocked_profile = user_to_unblock.profile

        deleted_count, _ = unblocking_profile.unblock_user(unblocked_profile)
        if deleted_count > 0:
            return JsonResponse({
                "success": True,
                "message": f"Successfully unfollowed {user_to_unblock.username}"
            })
        else:
            return JsonResponse({
                "success": False,
                "message": f"You are not following {user_to_unblock.username}"
            }, status=404)

    
    except Exception as e:
        return JsonResponse({'message': str(e)}, status=500)


@api_view(["GET"])
def get_blocked(request):
    try:
        profile = request.user.profile
        blocked = profile.get_blocked()
        blocked_list = []

        for user in blocked:
            blocked_list.append(serialize_user(user.blocked.user, request.user))

        return JsonResponse({
            "success": True,
            "blocked": blocked_list
        })
    except Exception as e:
        return JsonResponse({'message': str(e)}, status=500)

