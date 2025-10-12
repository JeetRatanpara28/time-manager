defmodule TimeManagerPhx.Accounts.Guardian do
  @moduledoc """
  Guardian module for JWT token management
  """
  use Guardian, otp_app: :time_manager_phx

  alias TimeManagerPhx.Accounts

  def subject_for_token(user, _claims) do
    {:ok, to_string(user.id)}
  end

  def resource_from_claims(claims) do
    user_id = claims["sub"]
    case Accounts.get_user(user_id) do
      nil -> {:error, :resource_not_found}
      user -> {:ok, user}
    end
  end

  def authenticate(email, password) do
    case Accounts.get_user_by_email(email) do
      nil ->
        {:error, :unauthorized}
      user ->
        case TimeManagerPhx.Accounts.User.valid_password?(user, password) do
          true ->
            {:ok, user}
          false ->
            {:error, :unauthorized}
        end
    end
  end

  def generate_token(user) do
    {:ok, token, _claims} = encode_and_sign(user)
    {:ok, token}
  end

  def generate_refresh_token(user) do
    {:ok, refresh_token, _claims} = encode_and_sign(user, %{}, token_type: "refresh")
    {:ok, refresh_token}
  end

  # Custom function to refresh access tokens
  def refresh_access_token(refresh_token) do
    case decode_and_verify(refresh_token) do
      {:ok, claims} ->
        case resource_from_claims(claims) do
          {:ok, user} ->
            {:ok, new_token, new_claims} = encode_and_sign(user, %{}, token_type: "access")
            {:ok, new_token, new_claims}
          error ->
            error
        end
      error ->
        error
    end
  end

  # Alternative: Use Guardian's built-in exchange with proper options
  def exchange_token(refresh_token, options \\ []) do
    # Use Guardian's built-in exchange function
    exchange(refresh_token, ["refresh"], "access", options)
  end
end