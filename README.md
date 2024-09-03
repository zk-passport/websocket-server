#  OpenPassport WSS

## Context

This repo is a simple websocket server that is used to connect the [OpenPassport](https://openpassport.app) mobile app to web app implementating Openpassport [sdk](https://www.npmjs.com/package/@openpassport/sdk).

The websocket server is designed to run on a linux server with Node.js installed.

OpenPassport WSS is designed to be run with [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/) but can be run with any process manager or simply with node.


## Installation

Clone the repository:
```bash
git clone https://github.com/zk-passport/websocket-server
```

Install dependencies:
```bash
cd websocket-server
yarn install
```

## Usage

Start the server:
```bash
yarn start
```

## Nginx Configuration example

To ensure secure communication between the mobile application and the websocket server, it is necessary for the server to have an `HTTPS` endpoint.

Redirect your domain to the server ip address and [setup ssl with certbot.](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04)

Here is an example of an Nginx configuration that sets up an HTTPS endpoint for the websocket server:

````
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    server {
        listen 443 ssl;
        server_name <your-domain> www.<your-domain>;

        ssl_certificate /etc/letsencrypt/live/<your-domain>/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/<your-domain>/privkey.pem;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_prefer_server_ciphers on;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;

        location /websocket {
            proxy_pass http://localhost:3200;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```
