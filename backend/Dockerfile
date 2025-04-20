FROM	python:3.11-slim

# Set work directory
WORKDIR	/app

# Download dependencies
RUN		apt-get update && \
		apt-get install -y netcat-openbsd && \
		rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY	requirements.txt requirements.txt

# Install Python dependencies
RUN		pip install --upgrade pip && \
		pip install -r requirements.txt

# Copy entrypoint scripts
COPY	start.sh .

# Give permissions to entrypoint scripts
RUN		chmod +x start.sh

ENTRYPOINT ["./start.sh"]