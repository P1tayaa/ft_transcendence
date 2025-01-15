from django.urls import path
from . import views
from .user_management import get_current_user

# here for API endpoints, pages are routed through templates
urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),               # to comment out
    # path('profile/', views.create_profile, name='create_profile'),       # to comment out
    path('me/', get_current_user, name='current_user'),
    path('bundle.js', views.get_bundle),  # Add this route
]
