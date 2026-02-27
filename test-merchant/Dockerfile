FROM node:18-alpine
WORKDIR /app
RUN npm init -y && npm install express
COPY index.js .
EXPOSE 4000
CMD ["node", "index.js"]
