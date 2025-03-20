#!/bin/bash

echo "Waiting for postgres..."
while ! nc -z db 5432; do
    sleep 0.1
done
echo "PostgreSQL started"

python src/manage.py makemigrations game
python src/manage.py makemigrations users
python src/manage.py makemigrations api
python src/manage.py makemigrations

DJANGO_SUPERUSER_USERNAME=admin \
DJANGO_SUPERUSER_EMAIL=admin@example.com \
DJANGO_SUPERUSER_PASSWORD=adminpassword \
python src/manage.py createsuperuser --noinput
# Apply migrations
python src/manage.py migrate

# Start server
# exec python src/manage.py runserver 0.0.0.0:8000
cd /app

export DJANGO_SETTINGS_MODULE=config.settings.dev
exec python src/manage.py runserver 0.0.0.0:8000
