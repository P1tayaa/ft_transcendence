from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    path('profile/', views.create_profile, name='create_profile'),
]