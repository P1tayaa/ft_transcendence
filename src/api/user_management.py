from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

# User.objects.create_user should add to database itself
def create_user(user_data):
    try:
        user = User.objects.create_user(
            username=user_data['username'],
            email=user_data.get('email'),
            password=user_data['password']
        )
        return True, user
    except Exception as e:
        return False, str(e)


@api_view(['POST'])
def register_user(request):
    user_data = request.data

    if not user_data.get('username') or not user_data.get('password'):
        return Response({'error': 'Username and password are required'}, status=400)

    success, result =create_user(user_data)
    if success:
        return Response({'message': 'User created successfully'}, status=201)
    return Response({'error': str(result)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    return Response({
                'username': request.user.username
                # blabla
            })
    
