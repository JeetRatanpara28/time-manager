#!/bin/bash
set -e

echo "Waiting for database..."
until psql "$DATABASE_URL" -c '\q'; do
  sleep 2
done

mix ecto.create
mix ecto.migrate

exec mix phx.server