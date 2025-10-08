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
end
