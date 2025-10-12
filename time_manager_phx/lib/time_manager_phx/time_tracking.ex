defmodule TimeManagerPhx.TimeTracking do
  @moduledoc """
  The TimeTracking context.
  """

  import Ecto.Query, warn: false
  alias TimeManagerPhx.Repo
  alias TimeManagerPhx.TimeTracking.WorkingTime
  alias TimeManagerPhx.TimeTracking.Clock

  # WorkingTime functions

  @doc """
  Returns the list of workingtimes.
  """
  def list_workingtimes do
    Repo.all(WorkingTime)
  end

  @doc """
  Gets a single working_time (returns nil if not found).
  """
  def get_working_time(id) do
    Repo.get(WorkingTime, id)
  end

  @doc """
  Gets a single working_time (raises if not found).
  """
  def get_working_time!(id) do
    Repo.get!(WorkingTime, id)
  end

  @doc """
  Creates a working_time.
  """
  def create_working_time(attrs) do
    %WorkingTime{}
    |> WorkingTime.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a working_time.
  """
  def update_working_time(%WorkingTime{} = working_time, attrs) do
    working_time
    |> WorkingTime.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a working_time.
  """
  def delete_working_time(%WorkingTime{} = working_time) do
    Repo.delete(working_time)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking working_time changes.
  """
  def change_working_time(%WorkingTime{} = working_time, attrs \\ %{}) do
    WorkingTime.changeset(working_time, attrs)
  end

  @doc """
  Gets workingtimes for a specific user.
  """
  def list_workingtimes_for_user(user_id) do
    Repo.all(from w in WorkingTime, where: w.user_id == ^user_id, order_by: [desc: w.date])
  end

  # Clock functions

  @doc """
  Lists all clocks for a specific user.
  """
  def list_clocks_for_user(user_id) do
    Repo.all(from c in Clock, where: c.user_id == ^user_id, order_by: [desc: c.time])
  end

  @doc """
  Creates a clock.
  """
  def create_clock(attrs) do
    %Clock{}
    |> Clock.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Gets the last clock for a specific user.
  """
  def last_clock_for_user(user_id) do
    Repo.one(from c in Clock, where: c.user_id == ^user_id, order_by: [desc: c.time], limit: 1)
  end

  @doc """
  Deletes all time tracking data (clocks and workingtimes) for a given user.
  """
  def delete_all_for_user(user_id) do
    # Delete clocks first, then working times to satisfy any FK constraints
    Repo.delete_all(from c in Clock, where: c.user_id == ^user_id)
    Repo.delete_all(from w in WorkingTime, where: w.user_id == ^user_id)
    :ok
  end
end