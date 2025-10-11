defmodule TimeManagerPhxWeb.AuthController do
  @moduledoc """
  Authentication controller for JWT-based authentication
  """
  use TimeManagerPhxWeb, :controller

  alias TimeManagerPhx.Accounts
  alias TimeManagerPhx.Accounts.User
  alias TimeManagerPhx.Accounts.Guardian

  action_fallback TimeManagerPhxWeb.FallbackController

  @doc """
  User login endpoint
  """
  def login(conn, %{"email" => email, "password" => password}) do
    case Guardian.authenticate(email, password) do
      {:ok, user} ->
        {:ok, token} = Guardian.generate_token(user)
        {:ok, refresh_token} = Guardian.generate_refresh_token(user)

        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          token: token,
          refreshToken: refresh_token,
          user: %{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department
          }
        })

      {:error, _reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{
          success: false,
          error: "Invalid credentials"
        })
    end
  end

  @doc """
  User registration endpoint (for GM to create users)
  """
  def register(conn, %{"user" => user_params}) do
    with {:ok, %User{} = user} <- Accounts.register_user(user_params) do
      conn
      |> put_status(:created)
      |> json(%{
        success: true,
        user: %{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      })
    end
  end

  @doc """
  Get current user profile
  """
  def profile(conn, _params) do
    user = conn.assigns[:current_user]

    case user do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{
          success: false,
          error: "Not authenticated"
        })

      user ->
        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          user: %{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            status: user.status,
            last_seen: user.last_seen
          }
        })
    end
  end

  @doc """
  Refresh JWT token
  """
  def refresh(conn, %{"refresh_token" => refresh_token}) do
    case Guardian.refresh_access_token(refresh_token) do
      {:ok, new_token, _new_claims} ->
        conn
        |> put_status(:ok)
        |> json(%{
          success: true,
          token: new_token
        })

      {:error, _reason} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{
          success: false,
          error: "Invalid refresh token"
        })
    end
  end

  @doc """
  User logout (client-side token removal)
  """
  def logout(conn, _params) do
    conn
    |> put_status(:ok)
    |> json(%{
      success: true,
      message: "Successfully logged out"
    })
  end
end