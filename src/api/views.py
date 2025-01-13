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


@api_view(['GET'])
def get_bundle(request):
    bundle_path = os.path.join('frontend', 'dist', 'bundle.js')
    return FileResponse(open(bundle_path, 'rb'), content_type='application/javascript)
