from django.shortcuts import render
import os
from rest_framework.decorators import api_view



# pattern for single page application
def home(request):
    return render(request, 'base.html', {
                      'template_name' : 'pages/home.html'
                  })

def game(request):
    return render(request, 'base.html', {
                          'template_name' : 'pages/gameplay.html' 
                      })

def profile(request):
    return render(request, 'base.html', {
                              'template_name' : 'pages/profile.html'
                          })

def chat(request):
    return render(request, 'base.html', {
                                  'template_name': 'pages/chat.html'
                              })

def friendlist(request):
    return render(request, 'base.html', {
                                  'template_name': 'pages/friendlist.html'
                              })

def login(request):
    return render(request, 'base.html', {
                                  'template_name': 'pages/login.html'
                              })
    

@api_view(["GET"])
def hello_world(request):
    return Response({"message": "Hello from Django!"})


@api_view(["POST"])
def create_profile(request):
    data = request.data
    # Process the data here
    return Response({"status": "Profile created", "data": data})


@api_view(["GET"])
def get_bundle(request):
    bundle_path = os.path.join("frontend", "dist", "bundle.js")
    return FileResponse(open(bundle_path, "rb"), content_type="application/javascript")
