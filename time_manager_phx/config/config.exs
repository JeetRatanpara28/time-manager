import Config

# Only run this in production
if config_env() == :prod do
  # Database configuration from Fly secret
  database_url =
    System.get_env("DATABASE_URL") ||
      raise "DATABASE_URL is missing. Please set it in Fly secrets."

  config :time_manager_phx, TimeManagerPhx.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    ssl: true

  # Endpoint configuration
  config :time_manager_phx, TimeManagerPhxWeb.Endpoint,
    http: [
      ip: {0, 0, 0, 0},
      port: String.to_integer(System.get_env("PORT") || "8080")
    ],
    url: [host: System.get_env("FLY_APP_NAME") <> ".fly.dev", port: 443],
    secret_key_base: System.get_env("SECRET_KEY_BASE"),
    server: true
end
