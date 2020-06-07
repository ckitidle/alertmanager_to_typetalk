FROM node:12.18.0-stretch
LABEL MAINTAINER "ckitidle <ckit.ilakg@gmail.com>"

COPY ./src /app
WORKDIR /app
RUN npm install

EXPOSE 3000
CMD [ "npm", "start" ]