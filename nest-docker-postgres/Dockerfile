FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install @nestjs/typeorm typeorm pg

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:dev" ]
