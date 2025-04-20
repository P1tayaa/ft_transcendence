from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'nginx']

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
	"http://nginx",
	"http://localhost",
]

