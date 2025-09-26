defmodule TimeManagerPhxWeb.UserController do
  use TimeManagerPhxWeb, :controller

  alias TimeManagerPhx.Accounts
  alias TimeManagerPhx.Accounts.User
  alias TimeManagerPhx.TimeTracking

  action_fallback TimeManagerPhxWeb.FallbackController

  def index(conn, params) do
    username = Map.get(params, "username")
    email = Map.get(params, "email")
    users = Accounts.search_users(username, email)
    render(conn, :index, users: users)
  end

  def create(conn, %{"user" => user_params}) do
    with {:ok, %User{} = user} <- Accounts.create_user(user_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/users/#{user}")
      |> render(:show, user: user)
    end
  end

  def show(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    render(conn, :show, user: user)
  end

  def update(conn, %{"id" => id, "user" => user_params}) do
    user = Accounts.get_user!(id)

    with {:ok, %User{} = user} <- Accounts.update_user(user, user_params) do
      render(conn, :show, user: user)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    # Delete dependent records first to avoid FK constraint errors
    TimeTracking.delete_all_for_user(id)
    with {:ok, %User{}} <- Accounts.delete_user(user) do
      send_resp(conn, :no_content, "")
    end
  end
end
