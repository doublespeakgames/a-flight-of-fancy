FROM node:11

WORKDIR /app

COPY src/package.json .
RUN yarn install

COPY ./src .