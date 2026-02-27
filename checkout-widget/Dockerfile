FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
# Ensure dist exists and copy HTML
RUN mkdir -p dist && cp src/iframe-content/index.html dist/checkout.html

EXPOSE 3001

CMD ["npm", "run", "start"]
