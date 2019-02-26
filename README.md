# Voice Adventure
An experiment in voice-controlled narrative

## Structure
The components of the project are defined in Docker containers, and glued together using `docker-compose`. 

### Development
`docker-compose up` creates a development environment. App code can be refreshed without a build, by restarting the app service.

### Production
`./docker-prod up` creates a production environment. It includes an NGINX reverse proxy and TLS support.

### Deployment
1. `eval $(docker-machine env voice-adventure)`
2. If certificates do not yet exist, run `./create-certs`
3. `./docker-prod build`
4. `./docker-prod up -d`

### DialogFlow
`Voice-Adventure.zip` is a DialogFlow export file. You can import it into a DialogFlow agent to make this whole thing work.