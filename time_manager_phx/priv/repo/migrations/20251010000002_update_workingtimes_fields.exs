defmodule TimeManagerPhx.Repo.Migrations.UpdateWorkingtimesFields do
  use Ecto.Migration

  def change do
    alter table(:workingtimes) do
      add :date, :date
      add :clock_in, :string
      add :clock_out, :string
      add :break_start, :string
      add :break_end, :string
      add :total_hours, :decimal, precision: 10, scale: 2
      add :overtime, :decimal, precision: 10, scale: 2
      add :status, :string, default: "active"
    end

    # Add indexes for better query performance
    create index(:workingtimes, [:date])
    create index(:workingtimes, [:status])
  end
end