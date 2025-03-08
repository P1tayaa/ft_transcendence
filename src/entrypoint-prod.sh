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
# Apply migrations
python src/manage.py migrate

# certificates
mkdir -p /app/ssl
if [ ! -f /app/ssl/cert.pem ] || [ ! -f /app/ssl/key.pem ]; then
  echo "Generating SSL certificates..."
  openssl req -x509 -newkey rsa:4096 -keyout /app/ssl/key.pem -out /app/ssl/cert.pem -days 365 -nodes -subj "/CN=localhost"
fi



# Start server
# exec python src/manage.py runserver 0.0.0.0:8000
cd /app/src

python manage.py collectstatic --noinput
export PYTHONPATH=$PYTHONPATH:/app/src
export DJANGO_SETTINGS_MODULE=config.settings.prod
exec daphne -e ssl:8000:privateKey=/app/ssl/key.pem:certKey=/app/ssl/cert.pem config.asgi:application
