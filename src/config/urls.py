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

from django.conf.urls.static import static
from django.urls import path, include
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings

from apps.api.views.pages import (
    spa_entry,
)

# this pattern to serve single page application
urlpatterns = [
    path("api/", include("apps.api.urls")),  # API endpoints
    path('', ensure_csrf_cookie(spa_entry), name="spa_entry"),
    path('<path:path>', ensure_csrf_cookie(spa_entry), name="spa_catchall"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
