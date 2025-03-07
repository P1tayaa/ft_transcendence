FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  build-essential \
  libpq-dev \
  nodejs \
  npm \
  netcat-traditional \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy project
COPY . .
# Set up Webpack dependencies
WORKDIR /app/src/static/js/threejs
COPY src/static/js/threejs/package.json ./package.json

# Install npm dependencies
RUN npm install

# Build Webpack bundle
RUN npm run build

WORKDIR /app

RUN chmod +x src/entrypoint-dev.sh
RUN chmod +x src/entrypoint-prod.sh
CMD ["./src/entrypoint-dev.sh"]
# CMD ["python", "src/manage.py", "runserver", "0.0.0.0:8000"]
