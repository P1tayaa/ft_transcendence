#!/bin/bash

echo "Waiting for postgres..."
while ! nc -z db 5432; do
    sleep 0.1
done
echo "PostgreSQL started"

python manage.py makemigrations game
python manage.py makemigrations users
python manage.py makemigrations api
python manage.py makemigrations
# Apply migrations
python manage.py migrate

# certificates
mkdir -p /app/ssl
if [ ! -f /app/ssl/cert.pem ] || [ ! -f /app/ssl/key.pem ]; then
  echo "Generating SSL certificates..."
  openssl req -x509 -newkey rsa:4096 -keyout /app/ssl/key.pem -out /app/ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"
fi

# Collect static files
python manage.py collectstatic --noinput

# Start server
export PYTHONPATH=$PYTHONPATH:/app
export DJANGO_SETTINGS_MODULE=config.prod
exec daphne -e ssl:8000:privateKey=/app/ssl/key.pem:certKey=/app/ssl/cert.pem config.asgi:application
