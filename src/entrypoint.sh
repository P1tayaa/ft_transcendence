#!/bin/bash

echo "Waiting for postgres..."
while ! nc -z db 5432; do
    sleep 0.1
done
echo "PostgreSQL started"

python src/manage.py makemigrations game
python src/manage.py makemigrations

# Apply migrations
python src/manage.py migrate

# Start server
exec python src/manage.py runserver 0.0.0.0:8000
