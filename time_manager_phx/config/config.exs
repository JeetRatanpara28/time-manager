# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :time_manager_phx,
  ecto_repos: [TimeManagerPhx.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true]

# Configures the endpoint
config :time_manager_phx, TimeManagerPhxWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: TimeManagerPhxWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: TimeManagerPhx.PubSub,
  live_view: [signing_salt: "kakIVh6G"]

# Configures the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :time_manager_phx, TimeManagerPhx.Mailer, adapter: Swoosh.Adapters.Local

# Configures Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Guardian configuration for JWT authentication
config :time_manager_phx, TimeManagerPhx.Accounts.Guardian,
  issuer: "time_manager_phx",
  secret_key: "your-secret-key-here-change-this-in-production",
  token_ttl: %{
    "access" => {2, :hours},  # Extended for testing
    "refresh" => {7, :days}
  }

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
