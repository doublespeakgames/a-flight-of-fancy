FROM mongo:4

ENV MONGO_INITDB_DATABASE voice-adventure

COPY ./init.js /docker-entrypoint-initdb.d/
RUN chmod a+x /docker-entrypoint-initdb.d/init.js
