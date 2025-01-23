from django.urls import path
from . import views
from .user_management import (
    get_current_user,
    register_user,
    login_user,
    check_auth_status,
    add_friend,
)
from .chat_management import get_chat_data

# here for API endpoints, pages are routed through templates
urlpatterns = [
    # path('hello/', views.hello_world, name='hello_world'),               # to comment out
    # path('profile/', views.create_profile, name='create_profile'),       # to comment out
    path("register/", register_user, name="register_user"),
    path("login/", login_user, name="login_user"),
    path("auth-status/", check_auth_status, name="check_auth_status"),
    path("me/", get_current_user, name="current_user"),
    path("get_chat_data/", get_chat_data, name="get_chat_data"),
    path("add_friend/", add_friend, name="add_friend"),
]
