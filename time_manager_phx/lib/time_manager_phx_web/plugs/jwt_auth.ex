defmodule TimeManagerPhxWeb.Plugs.JWTAuth do
  @moduledoc """
  JWT Authentication plug for protecting routes
  """
  import Plug.Conn

  alias TimeManagerPhx.Accounts.Guardian

  def init(opts), do: opts

  def call(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, claims} <- Guardian.decode_and_verify(token),
         {:ok, user} <- Guardian.resource_from_claims(claims) do
      # Put the user in the connection for later use
      conn = assign(conn, :current_user, user)

      # Continue with the request
      conn
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{
          success: false,
          error: "Unauthorized - Invalid or missing token"
        })
        |> halt()
    end
  end
end
