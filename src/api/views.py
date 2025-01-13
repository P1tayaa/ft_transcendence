from django.shortcuts import render

from rest_framework.decorators import api_view


@api_view(["GET"])
def hello_world(request):
    return Response({"message": "Hello from Django!"})


@api_view(["POST"])
def create_profile(request):
    data = request.data
    # Process the data here
    return Response({"status": "Profile created", "data": data})
