FROM node:19.4.0-slim

WORKDIR /server
COPY . .
RUN npm install

CMD ["npm", "run", "start"]
