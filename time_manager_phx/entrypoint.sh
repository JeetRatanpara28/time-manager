#!/bin/bash
set -e


# Setup and migrate DB
mix deps.get

echo "Waiting for database..."
until psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c '\q'; do
  sleep 2
done
mix ecto.create

mix ecto.migrate

exec mix phx.server
