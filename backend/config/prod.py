from .base import *

DEBUG = False

host_machine = os.environ.get('HOST_MACHINE', 'default_value')

# EVAL: add eval computer as allowed host
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'nginx', 'backend', host_machine]

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
	"https://localhost",
	"https://nginx",
]

# Accept nginx proxy headers
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Security settings
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# SECURE_HSTS_SECONDS = 31536000  # 1 year
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True

# Configure REST Framework for production
REST_FRAMEWORK = {
    # Merge with existing settings if they exist
    **(REST_FRAMEWORK if 'REST_FRAMEWORK' in globals() else {}),
    # Only return JSON in production
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}