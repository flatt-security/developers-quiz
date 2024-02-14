FROM node:21-alpine

WORKDIR /app
COPY package.json package-lock.json /app
RUN npm ci

COPY index.html index.js /app

CMD ["node", "index.js"]
