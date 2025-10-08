defmodule TimeManagerPhx.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias TimeManagerPhx.Repo

  alias TimeManagerPhx.Accounts.User

  @doc """
  Returns the list of users.

  ## Examples

      iex> list_users()
      [%User{}, ...]

  """
  def list_users do
    Repo.all(User)
  end

  @doc """
  Search users by optional username and/or email (case-insensitive, partial match).

  If both params are nil or empty, returns all users.
  """
  def search_users(username, email) do
    base = from u in User

    base =
      if is_binary(username) and String.trim(username) != "" do
        like = "%" <> String.replace(username, "%", "\\%") <> "%"
        from u in base, where: ilike(u.username, ^like)
      else
        base
      end

    base =
      if is_binary(email) and String.trim(email) != "" do
        like = "%" <> String.replace(email, "%", "\\%") <> "%"
        from u in base, where: ilike(u.email, ^like)
      else
        base
      end

    Repo.all(base)
  end

  @doc """
  Gets a single user.

  Returns nil if the User does not exist.

  ## Examples

      iex> get_user(123)
      %User{}

      iex> get_user(456)
      nil

  """
  def get_user(id), do: Repo.get(User, id)

  @doc """
  Creates a user.

  ## Examples

      iex> create_user(%{field: value})
      {:ok, %User{}}

      iex> create_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_user(attrs) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user.

  ## Examples

      iex> update_user(user, %{field: new_value})
      {:ok, %User{}}

      iex> update_user(user, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a user.

  ## Examples

      iex> delete_user(user)
      {:ok, %User{}}

      iex> delete_user(user)
      {:error, %Ecto.Changeset{}}

  """
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Creates a user with password registration.

  ## Examples

      iex> register_user(%{field: value})
      {:ok, %User{}}

      iex> register_user(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def register_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Gets a user by email and password.

  ## Examples

      iex> get_user_by_email_and_password("user@example.com", "password")
      %User{}

      iex> get_user_by_email_and_password("user@example.com", "wrong_password")
      nil

  """
  def get_user_by_email_and_password(email, password) do
    user = Repo.get_by(User, email: email)
    if user && User.valid_password?(user, password) do
      user
    else
      nil
    end
  end

  @doc """
  Gets a user by email.

  ## Examples

      iex> get_user_by_email("user@example.com")
      %User{}

      iex> get_user_by_email("nonexistent@example.com")
      nil

  """
  def get_user_by_email(email) do
    Repo.get_by(User, email: email)
  end
end
