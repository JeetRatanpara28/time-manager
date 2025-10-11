defmodule TimeManagerPhx.Repo.Migrations.AddUserProfileFields do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :department, :string
      add :phone, :string
      add :status, :string, default: "offline"
      add :last_seen, :utc_datetime
      add :bio, :text
    end

    # Add indexes for faster queries
    create index(:users, [:role])
    create index(:users, [:department])
    create index(:users, [:status])
  end
end