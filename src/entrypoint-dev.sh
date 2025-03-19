#!/bin/bash

echo "Waiting for postgres..."
while ! nc -z db 5432; do
    sleep 0.1
done
echo "PostgreSQL started"

export DJANGO_SETTINGS_MODULE=config.dev

# Make and apply migrations
python manage.py makemigrations game
python manage.py makemigrations users
python manage.py makemigrations api
python manage.py makemigrations
python manage.py migrate

# Start server
exec python manage.py runserver 0.0.0.0:8000
