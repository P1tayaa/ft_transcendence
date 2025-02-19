from django.middleware.csrf import get_token

class CSRFMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Set CSRF cookie for all responses
        get_token(request)
        return response
