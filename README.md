
# Newspapers platform

This is a webapp that makes newspapers data available to the public. Users can search and analyse collections of newspapers.


## Deployment
### First steps
The application run on Ruby 3.0.1. You can install it using rvm.
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
