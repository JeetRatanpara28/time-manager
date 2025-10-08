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
      |> put_resp_header("location", "/api/users/#{user.id}")
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

  def stats(conn, _params) do
    users = Accounts.list_users()

    stats = %{
      total_users: length(users),
      online_users: Enum.count(users, &(&1.status == "online")),
      offline_users: Enum.count(users, &(&1.status == "offline")),
      employees: Enum.count(users, &(&1.role == "employee")),
      managers: Enum.count(users, &(&1.role == "manager")),
      general_managers: Enum.count(users, &(&1.role == "general_manager")),
      departments: users |> Enum.map(& &1.department) |> Enum.uniq() |> length()
    }

    json(conn, stats)
  end

  def delete(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    # Delete dependent records first to avoid FK constraint errors
    TimeTracking.delete_all_for_user(id)
    with {:ok, %User{}} <- Accounts.delete_user(user) do
      send_resp(conn, :no_content, "")
    end
  end

  # Handle CORS preflight OPTIONS requests
  def options(conn, _params) do
    conn
    |> put_resp_header("access-control-allow-origin", "http://localhost:5173")
    |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS")
    |> put_resp_header("access-control-allow-headers", "Content-Type, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since")
    |> put_resp_header("access-control-max-age", "1728000")
    |> send_resp(204, "")
  end
end
