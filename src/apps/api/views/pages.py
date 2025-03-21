from django.shortcuts import render
from django.middleware.csrf import get_token

# pattern for single page application
def spa_entry(request, path=None):
    context = {
        'csrf_token': get_token(request),
    }
    if request.user.is_authenticated:
        context['user_data'] = {
            'username': request.user.username,
            'is_authenticated': True,
        }
    return render(request, "index.html", context)
