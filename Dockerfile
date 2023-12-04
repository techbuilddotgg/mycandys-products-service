FROM node:18-alpine

ENV PORT='8080'
ENV MONGODB_URI='mongodb://localhost:27017/default'
ENV AUTH_SERVICE_URL='http://localhost:8081'

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
