# Guide here:
# https://github.com/KyleAMathews/docker-nginx

# Build docker file
# docker build -t CONTAINERNAME .

# Build from this repo's image
FROM kyma/docker-nginx

# Add src.
COPY build/ /var/www

CMD 'nginx'