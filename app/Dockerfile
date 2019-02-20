FROM node:11

RUN useradd --user-group --create-home --shell /bin/false app
ENV HOME=/home/app

WORKDIR $HOME

COPY ./package.json .
RUN yarn install

COPY src/ ./src
RUN yarn build

RUN chown -R app:app $HOME/*

USER app