defmodule TimeManagerPhx.Repo do
  use Ecto.Repo,
    otp_app: :time_manager_phx,
    adapter: Ecto.Adapters.Postgres
end
