defmodule TimeManagerPhx.Repo.Migrations.UpdateSchemasForGmDashboard do
  use Ecto.Migration

  def change do
    # Update users table with new fields for GM dashboard
    alter table(:users) do
      add :name, :string
      add :role, :string, default: "employee"
      add :department, :string
      add :phone, :string
      add :status, :string, default: "offline"
      add :last_seen, :utc_datetime
      add :bio, :text
    end

    # Create index on role for faster queries
    create index(:users, [:role])

    # Create index on status for faster queries
    create index(:users, [:status])

    # Create index on department for faster queries
    create index(:users, [:department])

    # Update workingtimes table - keep existing start/end but add new fields
    alter table(:workingtimes) do
      # Add new fields for detailed time tracking
      add :date, :date
      add :clock_in, :string
      add :clock_out, :string
      add :break_start, :string
      add :break_end, :string
      add :total_hours, :decimal
      add :overtime, :decimal
      add :status, :string, default: "active"
    end

    # Create index on status for faster queries
    create index(:workingtimes, [:status])

    # Create index on date for faster queries
    create index(:workingtimes, [:date])

    # Create composite index for user and date queries
    create index(:workingtimes, [:user_id, :date])

    # Update existing workingtimes records to have date field
    # This will be populated from the start datetime
    execute("""
    UPDATE workingtimes
    SET date = DATE(start)
    WHERE date IS NULL AND start IS NOT NULL
    """)
  end
end
