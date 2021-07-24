# README

## Setting up the database
Create a docker container and create an empty database named "newspapers"

`docker run --name newspapers_platform_database -e POSTGRES_PASSWORD=secret -p 127.0.0.1:5433:5432 -d postgres`

`docker exec -it newspapers_platform_database createdb -U postgres newspapers`

Modify the content of `config/database.yml` accordingly.