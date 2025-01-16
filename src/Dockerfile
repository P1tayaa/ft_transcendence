FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  libpq-dev \
  nodejs \
  npm \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy project
COPY . .

RUN cd src/api/static/js/threejs/ && npm install --save-dev webpack webpack-cli three
RUN cd src/api/static/js/threejs/ && npx webpack
CMD ["python", "src/manage.py", "runserver", "0.0.0.0:8000"]
