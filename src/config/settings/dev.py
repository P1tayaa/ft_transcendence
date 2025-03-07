from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']

MIDDLEWARE = [m for m in MIDDLEWARE if not m.startswith('whitenoise')]

# STATIC_ROOT = os.path.join(BASE_DIR, "static")
STATIC_URL = '/static/'
