defmodule TimeManagerPhx.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "users" do
    field :username, :string
    field :email, :string
    field :password, :string, virtual: true  # Virtual field for password input
    field :password_hash, :string  # Actual hashed password stored in DB
    field :name, :string
    field :role, :string, default: "employee"  # employee, manager, general_manager
    field :department, :string
    field :phone, :string
    field :status, :string, default: "offline"  # online, offline
    field :last_seen, :utc_datetime
    field :bio, :string

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:username, :email, :password, :name, :role, :department, :phone, :status, :last_seen, :bio])
    |> validate_required([:username, :email, :name])
    |> validate_inclusion(:role, ["employee", "manager", "general_manager"])
    |> validate_inclusion(:status, ["online", "offline"])
    |> unique_constraint(:email)
    |> unique_constraint(:username)
    |> validate_password()
    |> put_password_hash()
  end

  # Registration changeset (includes password validation)
  def registration_changeset(user, attrs) do
    user
    |> changeset(attrs)
    |> validate_required([:password])
    |> validate_length(:password, min: 6, max: 100)
  end

  # Password validation
  defp validate_password(changeset) do
    changeset
    |> validate_length(:password, min: 6, max: 100)
  end

  # Hash password if provided
  defp put_password_hash(%Ecto.Changeset{valid?: true, changes: %{password: password}} = changeset) do
    put_change(changeset, :password_hash, Pbkdf2.hash_pwd_salt(password))
  end

  defp put_password_hash(changeset), do: changeset

  # Verify password
  def valid_password?(%TimeManagerPhx.Accounts.User{password_hash: hashed_password}, password) do
    Pbkdf2.verify_pass(password, hashed_password)
  end

  def valid_password?(_, _), do: Pbkdf2.no_user_verify()
end
