"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
import os
from django.http import FileResponse, Http404
from django.conf import settings
from urllib.parse import urlparse, unquote


def serve_frontend(request, filename="index.html"):
    # Decode and clean the filename
    decoded_path = unquote(urlparse(filename).path)

    # Path to the frontend directory
    frontend_path = os.path.join(settings.BASE_DIR, "frontend")

    # Construct the full file path
    file_path = os.path.normpath(os.path.join(frontend_path, decoded_path))

    # Ensure the file path is within the frontend directory
    if not file_path.startswith(frontend_path):
        raise Http404("File not found")

    # Serve the file if it exists
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(open(file_path, "rb"))
    else:
        raise Http404("File not found")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    # Route for frontend files
    path("<path:filename>", serve_frontend),
    # Default to index.html if no file is specified
    path("", serve_frontend),
]