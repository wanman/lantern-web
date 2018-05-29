FROM node:carbon

WORKDIR /opt/lantern/app
COPY package*.json ./
RUN npm install
COPY public ./public
COPY main.js .
COPY lib ./lib
EXPOSE 80

CMD ["npm", "start"]