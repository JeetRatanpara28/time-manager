defmodule TimeManagerPhxWeb.UserJSON do
  alias TimeManagerPhx.Accounts.User

  @doc """
  Renders a list of users.
  """
  def index(%{users: users}) do
    %{data: for(user <- users, do: data(user))}
  end

  @doc """
  Renders a single user.
  """
  def show(%{user: user}) do
    %{data: data(user)}
  end

  defp data(%User{} = user) do
    %{
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      phone: user.phone,
      status: user.status,
      joinDate: user.inserted_at,
      bio: user.bio
    }
  end
end
