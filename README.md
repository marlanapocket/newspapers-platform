# README

## Setting up the database
Create a docker container and create an empty database named "newspapers"

`docker run --name newspapers_platform_database -e POSTGRES_PASSWORD=secret -p 127.0.0.1:5433:5432 -d postgres`

`docker exec -it newspapers_platform_database createdb -U postgres newspapers`

Modify the content of `config/database.yml` according to your configuration.

## Setting up Redis
Used by Sidekiq and Rails

`docker run --name newspapers_redis -p 127.0.0.1:6379:6379 -d redis`

## Setting up a IIIF server
Cantaloupe


## Starting the server
`bundle exec sidekiq`

`rails s`
