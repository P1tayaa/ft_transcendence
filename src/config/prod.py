from .base import *

DEBUG = False
ALLOWED_HOSTS = ['*']

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATIC_ROOT = os.path.join(BASE_DIR.parent, "static")  # This is a new directory
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

WHITENOISE_ROOT = None  # Don't serve files from WHITENOISE_ROOT
WHITENOISE_INDEX_FILE = False  # Don't look for index.html
WHITENOISE_AUTOREFRESH = True  # Refresh files during development
