
# Newspapers platform

This is a webapp that makes newspapers data available to the public. Users can search and analyse collections of newspapers.

## IIIF server
### Installation
Install iipimage-server (https://iipimage.sourceforge.io). 
### Configure IIPImage as a service
Create a `iipsrv.service` file in `/lib/systemd/system/` with the following content (modify the ExecStart path to the iip server binary):
```bash
[Install]
WantedBy=multi-user.target

[Unit]
Description=IIPImage server
After=network.target
Documentation=https://iipimage.sourceforge.io man:iipsrv(8)

[Service]
User=www-data
Group=www-data
EnvironmentFile=/etc/default/iipsrv
ExecStart=/path/to/iipsrv.fcgi --bind 0.0.0.0:9000
Restart=on-failure
```
The configurations of this Image server can be put in a file (`/etc/default/iipsrv`):
```bash
VERBOSITY=5
LOGFILE=/var/log/iipsrv.log
MAX_IMAGE_CACHE_SIZE=10
JPEG_QUALITY=90
MAX_CVT=5000
MEMCACHED_SERVERS=localhost
CORS=*
FILESYSTEM_PREFIX=/home/axel/images/
```
### Configure web server
Add this to your nginx configuration:
```bash
merge_slashes off;
rewrite ^/iiif/(.*) /fcgi-bin/iipsrv.fcgi?IIIF=%2F$1 last;
location /fcgi-bin/iipsrv.fcgi {
	fastcgi_pass 	localhost:9000;
	fastcgi_param   PATH_INFO $fastcgi_script_name;
        fastcgi_param   REQUEST_METHOD $request_method;
        fastcgi_param   QUERY_STRING $query_string;
        fastcgi_param   CONTENT_TYPE $content_type;
        fastcgi_param   CONTENT_LENGTH $content_length;
        fastcgi_param   SERVER_PROTOCOL $server_protocol;
        fastcgi_param   REQUEST_URI $request_uri;
        fastcgi_param   HTTPS $https if_not_empty;
}
```

## Deployment
### First steps
The application runs on Ruby 3.0.1. You can install it using rvm.
```bash
  rvm install "ruby-3.0.1"
```
All dependencies of the project can then be installed using bundler
```bash
  bundle install
```
### Setting up the database
You can use a standalone database or use docker for this.
Create a docker container and create an empty database named "newspapers"
```bash
docker run --name newspapers_platform_database -e POSTGRES_PASSWORD=secret -p 127.0.0.1:5433:5432 -d postgres
```
```bash
docker exec -it newspapers_platform_database createdb -U postgres newspapers`
```
Modify the content of `config/database.yml` according to your configuration.

Launch migrations to effectively create the tables: `rails db:migrate`

### Setting up Redis and Sidekiq
Redis is used by the Sidekiq gem to keep track of background jobs. You can use docker to install it.
```bash
docker run --name newspapers_redis -p 127.0.0.1:6379:6379 -d redis
```
To actually start the Sidekiq process, enter `bundle exec sidekiq` in a new terminal.
To start the web server, use `rails server`
