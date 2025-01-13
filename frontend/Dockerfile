FROM node:16

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]

# backend/Dockerfile
FROM python:3.9

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# backend/requirements.txt
Django==4.2.0
djangorestframework==3.14.0
psycopg2-binary==2.9.6
django-cors-headers==3.14.0
