from django.shortcuts import render

# Create your views here.

@api_view(['GET'])
def hello_world(request):
    return Response({"message": "Hello from Django!"})

@api_view(['POST'])
def create_profile(request):
    data = request.data
    # Process the data here
    return Response({"status": "Profile created", "data": data})

