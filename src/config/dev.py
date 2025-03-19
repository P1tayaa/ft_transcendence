from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']

MIDDLEWARE = [m for m in MIDDLEWARE if not m.startswith('whitenoise')]
