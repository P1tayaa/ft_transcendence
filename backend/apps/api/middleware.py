from django.middleware.csrf import get_token
from django.http import JsonResponse

class CSRFMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Set CSRF cookie for all responses
        get_token(request)
        return response

class AjaxRedirectMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # if ajax request redirected to login, return 401 unauthorized
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        is_login_redirect = response.status_code == 302 and response.url.startswith("login/") # LOGIN_URL

        if is_ajax and is_login_redirect:
            JsonResponse({'message': 'Authentication required'}, status=401)

        return response
