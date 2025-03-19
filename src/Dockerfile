FROM	python:3.11-slim

# Install system dependencies
RUN		apt-get update && \
		apt-get install -y --no-install-recommends \
		build-essential \
		libpq-dev \
		nodejs \
		npm \
		netcat-traditional \
		&& apt-get clean \
		&& rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR	/app

# Copy project
COPY	./src .

# Install Python dependencies
RUN		pip install --no-cache-dir -r requirements.txt

# Give permissions to entrypoint scripts
RUN		chmod +x entrypoint-dev.sh
RUN		chmod +x entrypoint-prod.sh

ENTRYPOINT ["./entrypoint-dev.sh"]
