defmodule TimeManagerPhxWeb.Plugs.Authorize do
  @moduledoc """
  Authorization plug for role-based access control
  """
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, roles) when is_list(roles) do
    user = conn.assigns[:current_user]

    if user && user.role in roles do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{
        success: false,
        error: "Forbidden - Insufficient permissions"
      })
      |> halt()
    end
  end

  def call(conn, role) when is_binary(role) do
    call(conn, [role])
  end
end
