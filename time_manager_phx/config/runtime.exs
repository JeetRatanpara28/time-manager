import Config

# config/runtime.exs is executed for all environments, including
# during releases. It is executed after compilation and before the
# system starts, so it is typically used to load production configuration
# and secrets from environment variables or elsewhere.
# Do not define any compile-time configuration in here.

# Enable the Phoenix server if PHX_SERVER is set
if System.get_env("PHX_SERVER") do
  config :time_manager_phx, TimeManagerPhxWeb.Endpoint, server: true
end

if config_env() == :prod do
  # === DATABASE CONFIGURATION ===
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :time_manager_phx, TimeManagerPhx.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: maybe_ipv6
    # ssl: true, # Uncomment if your DB requires SSL

  # === SECRET KEY BASE ===
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  # === HOST AND PORT CONFIGURATION ===
  host = System.get_env("PHX_HOST") || System.get_env("FLY_APP_NAME") || "localhost"

  config :time_manager_phx, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  # === ENDPOINT CONFIGURATION ===
  port = String.to_integer(System.get_env("PORT") || "8080")
  config :time_manager_phx, TimeManagerPhxWeb.Endpoint,
  http: [ip: {0,0,0,0}, port: port],
  url: [host: host, port: port, scheme: "https"],
  secret_key_base: secret_key_base,
  server: true

  # === OPTIONAL: SSL CONFIGURATION ===
  #
  # Uncomment and configure these lines if you add SSL certificates later:
  #
  # config :time_manager_phx, TimeManagerPhxWeb.Endpoint,
  #   https: [
  #     port: 443,
  #     cipher_suite: :strong,
  #     keyfile: System.get_env("SOME_APP_SSL_KEY_PATH"),
  #     certfile: System.get_env("SOME_APP_SSL_CERT_PATH")
  #   ]
  #
  # config :time_manager_phx, TimeManagerPhxWeb.Endpoint,
  #   force_ssl: [hsts: true]

  # === MAILER CONFIGURATION (example) ===
  #
  # config :time_manager_phx, TimeManagerPhx.Mailer,
  #   adapter: Swoosh.Adapters.Mailgun,
  #   api_key: System.get_env("MAILGUN_API_KEY"),
  #   domain: System.get_env("MAILGUN_DOMAIN")
  #
  # config :swoosh, :api_client, Swoosh.ApiClient.Req
end
