FROM node:carbon
WORKDIR /opt/lantern/
RUN ls 
RUN mkdir ./db
COPY app /opt/lantern
RUN npm install
EXPOSE 80
CMD ["npm", "start"]