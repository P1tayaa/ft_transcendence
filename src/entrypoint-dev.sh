#!/bin/bash

echo "Waiting for postgres..."
while ! nc -z db 5432; do
    sleep 0.1
done
echo "PostgreSQL started"

export DJANGO_SETTINGS_MODULE=config.dev

# Make and apply migrations
python src/manage.py makemigrations game
python src/manage.py makemigrations users
python src/manage.py makemigrations api
python src/manage.py makemigrations
python src/manage.py migrate

# Run ThreeJS webpack
cd /app/src/static/js/threejs/
NODE_ENV=development
echo "Installing npm packages for ThreeJS..."
npm install --development || echo "npm install failed, continuing anyway..."
echo "Building ThreeJS..."
npm run build || echo "npm run build failed, continuing anyway..."

# Start server
cd /app
exec python src/manage.py runserver 0.0.0.0:8000
