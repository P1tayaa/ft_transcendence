#!/bin/bash

# Wait for database
echo "Waiting for PostgreSQL..."
while ! nc -z db 5432; do
    sleep 0.1
done
echo "PostgreSQL started"

# Migrations
python manage.py makemigrations game
python manage.py makemigrations users
python manage.py makemigrations api
python manage.py makemigrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start server
if [ "$PRODUCTION" = "True" ]; then
    echo "Running in production mode"
    exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
else
    echo "Running in development mode"
    exec python manage.py runserver 0.0.0.0:8000
fi