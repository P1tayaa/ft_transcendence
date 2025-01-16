#!/bin/bash

# Apply migrations
python src/manage.py migrate

# Start server
exec python src/manage.py runserver 0.0.0.0:8000
