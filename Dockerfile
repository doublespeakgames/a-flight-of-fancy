FROM node:11

RUN useradd --user-group --create-home --shell /bin/false app
ENV HOME=/home/app

WORKDIR $HOME/src

COPY src/package.json .
RUN yarn install

COPY ./src .

RUN chown -R app:app $HOME/*

USER app