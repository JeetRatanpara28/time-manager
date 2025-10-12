import Config

# Runtime configuration for all environments
# Loaded after compilation and before the system starts

# Enable Phoenix server if PHX_SERVER is set
if System.get_env("PHX_SERVER") do
  config :time_manager_phx, TimeManagerPhxWeb.Endpoint, server: true
end

if config_env() == :prod do
  # === DATABASE CONFIGURATION ===
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      It should be set automatically when you attach Fly Managed Postgres.
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :time_manager_phx, TimeManagerPhx.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: maybe_ipv6

  # === SECRET KEY BASE ===
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      Generate one with: mix phx.gen.secret
      """

  # === HOST AND PORT CONFIGURATION ===
  host = System.get_env("PHX_HOST") || System.get_env("FLY_APP_NAME") || "localhost"
  port = String.to_integer(System.get_env("PORT") || "8080")

  config :time_manager_phx, TimeManagerPhxWeb.Endpoint,
    http: [ip: {0, 0, 0, 0}, port: port],
    url: [host: host, port: port, scheme: "https"],
    secret_key_base: secret_key_base,
    server: true

  # Optional: Any other secrets or config values from Fly
  # config :time_manager_phx, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")
end
