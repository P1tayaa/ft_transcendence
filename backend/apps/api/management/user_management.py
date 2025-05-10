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


def serialize_user(user, viewer):
	data = {
		"id": user.id,
		"username": user.username,
		"avatar": user.profile.get_avatar(),
		"online": user.profile.online,
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


@ensure_csrf_cookie
@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
	try:
		username = request.POST.get("username")
		password = request.POST.get("password")

		if not all([username, password]):
			return JsonResponse({"success": False, "message": "Username and password are required."},status=status.HTTP_400_BAD_REQUEST)
		
		if len(username) > 12:
			return JsonResponse({"success": False, "message": "Username is too long."}, status=status.HTTP_400_BAD_REQUEST)
		
		if not username.isalnum():
			return JsonResponse({"success": False, "message": "Username cannot contain non-alphanumerical characters"}, status=status.HTTP_400_BAD_REQUEST)

		try:
			validate_password(password, request.user)
		except ValidationError as e:
			return JsonResponse({"success": False, "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

		if User.objects.filter(username=username).exists():
			return JsonResponse({"success": False, "message": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

		user = User.objects.create_user(
			username=username, password=password
		)

		user = authenticate(request, username=username, password=password)
		token = str(AccessToken.for_user(user))

		if user is None:
			return JsonResponse({"success": False, "message": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)

		 # Process avatar if provided
		avatar_result = upload_avatar(user, request)
		if avatar_result and not avatar_result.get('success', True):
			# Log the error but continue with registration
			print(f"Error uploading avatar: {avatar_result.get('message')}")

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
			return JsonResponse({
				"success": False,
				"message": "Invalid username or password.",
				"Provided": {"username": username, "password": password}
			}, status=status.HTTP_401_UNAUTHORIZED)

		token = str(AccessToken.for_user(user))

		return JsonResponse({
			"success": True,
			"message": "Login successful",
			"user": serialize_user(user, user),
			"token": token
		}, status=status.HTTP_201_CREATED)
	except Exception as e:
		return JsonResponse({
			"success": False,
			"message": str(e)
		}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


@ensure_csrf_cookie
@api_view(["GET"])
def fetch_matching_usernames(request):
	try:
		search = request.GET.get("username", "")
		if not search:
			return JsonResponse({"success": False, "message": "Username search term is required"}, status=400)

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


@ensure_csrf_cookie
@api_view(['GET'])
def get_match_history(request):
	try:
		# Fetch the match history for the user
		user_id = request.GET.get('user_id')

		if not user_id:
			return JsonResponse({'success': False, 'message': 'No user provided'}, status=400)

		try:
			user = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return JsonResponse({'success': False, 'message': 'User not found'}, status=404)

		match_history = user.profile.get_match_history()

		return JsonResponse({'success': True, 'games': match_history})
	except Exception as e:
		return JsonResponse({'success': False, 'message': str(e)}, status=500)



@api_view(["POST"])
def follow_user(request):
	try:
		user_id = request.data.get("user_id")
		if not user_id:
			return JsonResponse({'success': False, "message": "user_id is required"}, status=400)
		try:
			user_id = int(user_id)
		except ValueError:
			return JsonResponse({"success": False, "message": "Invalid user id format"}, status=400)

		try:
			user_to_follow = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return JsonResponse({"success": False, "message": "User not found"}, status=404)

		if user_id == request.user.id:
			return JsonResponse({"success": False, "message": "Cannot follow yourself"}, status=400)

		follower_profile = request.user.profile
		followed_profile = user_to_follow.profile
		if follower_profile.is_following(followed_profile):
			return JsonResponse({"success": False, "message": f"Already following {user_to_follow.username}"}, status=400)
		follow = follower_profile.follow_user(followed_profile)
		return JsonResponse({
			"success": True,
			"message": f"Successfully followed {user_to_follow.username}",
			"follow_id": follow.id
		}, status = 201)
	except Exception as e:
		return JsonResponse({'success': False, "message": str(e)}, status=400)

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
		return JsonResponse({"success": False, "message": str(e)}, status=500)

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
			return JsonResponse({'success': False, "message": "User not found"}, status=404)

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
		return JsonResponse({'success': False, 'message': str(e)}, status=500)


@api_view(["POST"])
def unblock_user(request):
	try:
		user_id = request.data.get("user_id")
		if not user_id:
			return JsonResponse({"success": False, "message": "user_id is required"}, status=400)

		try:
			user_to_unblock = User.objects.get(id=user_id)
		except User.DoesNotExist:
			return JsonResponse({'success': False, "message": "User not found"}, status=404)

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
		return JsonResponse({'success': False, 'message': str(e)}, status=500)


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
		return JsonResponse({'success': False, 'message': str(e)}, status=500)

import logging
logger = logging.getLogger(__name__)

@api_view(["POST"])
def update_user(request):
	try:
		# Get the request data
		data = request.data
		user = request.user

		logger.info(f"Request data: {data}")
		logger.info(f"User: {user}")

		# Process each type of update
		update_username(user, data)
		update_password(user, data)
		upload_avatar(user, request)
		delete_avatar(user, data)

		user.save()
		return JsonResponse({
			'success': True,
			'message': 'Profile updated successfully'
		}, status=200)

	except ValidationError as e:
		return JsonResponse({
			'success': False,
			'message': str(e)
		}, status=400)
	except Exception as e:
		return JsonResponse({
			'success': False,
			'message': str(e)
		}, status=500)

def update_username(user, data):
	"""Process username update request"""
	new_username = data.get('new_username')
	if not new_username or new_username == user.username:
		return

	# Check if username already exists
	if User.objects.filter(username=new_username).exclude(id=user.id).exists():
		raise ValidationError('Username already exists')
	
	# Check if username is valid
	if len(new_username) < 3 or len(new_username) > 8:
		raise ValidationError('Username must be between 3 and 8 characters long')

	if not new_username.isalnum():
		raise ValidationError('Username must contain only letters and numbers')

	user.username = new_username

def update_password(user, data):
	"""Process password update request"""
	old_password = data.get('old_password')
	new_password1 = data.get('new_password1')
	new_password2 = data.get('new_password2')

	if not all([old_password, new_password1, new_password2]):
		return

	if not user.check_password(old_password):
		raise ValidationError('Old password does not match')

	if new_password1 != new_password2:
		raise ValidationError('New passwords do not match')

	validate_password(new_password1, user)

	user.set_password(new_password1)

def upload_avatar(user, request):
	"""Process avatar upload request"""
	if 'avatar' not in request.FILES:
		return

	image = request.FILES['avatar']
	if not image.content_type.startswith('image/'):
		raise ValidationError('File must be an image')

	try:
		img = Image.open(image)
		max_size = (500, 500)
		img.thumbnail(max_size, Image.Resampling.LANCZOS)

		output = BytesIO()
		img.save(output, format='PNG', quality=85)
		output.seek(0)

		user.profile.avatar.save(
			f'avatar_{user.username}.png',
			ContentFile(output.read()),
			save=True
		)
	except Exception as e:
		raise ValidationError(f'Error processing image: {str(e)}')

def delete_avatar(user, data):
	"""Process avatar deletion request"""
	delete_picture = data.get('delete_avatar')
	if not delete_picture or delete_picture.lower() != 'true':
		return

	if not user.profile.avatar:
		return

	if os.path.isfile(user.profile.avatar.path):
		os.remove(user.profile.avatar.path)

	user.profile.avatar = None
	user.profile.save()