from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
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
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        # Use request.body instead of request.data
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        
        if not all([username, password]):
            return JsonResponse({
                'success': False,
                'message': 'Username and password are required.'
            }, status=400)

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'success': False,
                'message': 'Username already exists.'
            }, status=400)

        user = User.objects.create_user(
            username=username,
            email=email if email else None,
            password=password
        )

        return JsonResponse({
            'success': True,
            'message': 'User registered successfully.',
            'username': user.username
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

# @require_http_methods(["POST"])
# @ensure_csrf_cookie
# def register_user(request):
#     if request.method != "POST":
#         return JsonResponse({'error': 'Method not allowed'}, status=405)
#     try:
#         user_data = json.loads(request.body)
#         if not user_data.get("username") or not user_data.get("password"):
#             return Response({"error": "Username and password are required"}, status=400)

#         success, result = create_user(user_data)
#         if success:
#             return Response({"message": "User created successfully"}, status=201)
#         return Response({"error": str(result)}, status=400)
#     except json.JSONDecodeError:
#         return JsonResponse({
#             'success': False,
#             'message': 'Invalid JSON data'
#         }, status=400)
#     except Exception as e:
#         return JsonResponse({
#             'success': False,
#             'message': str(e)
#         }, status=500)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    return Response(
        {
            "username": request.user.username
            # blabla
        }
    )
