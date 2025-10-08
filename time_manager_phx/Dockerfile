FROM elixir:1.18-alpine

RUN apk add --no-cache postgresql-client bash

WORKDIR /app

# Copy mix files first to leverage cache
COPY mix.exs mix.lock ./

RUN mix local.hex --force && mix local.rebar --force
RUN mix deps.get

# Copy the rest of the application
COPY . .

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
