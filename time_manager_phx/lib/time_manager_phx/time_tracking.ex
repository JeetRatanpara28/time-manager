defmodule TimeManagerPhx.TimeTracking do
  @moduledoc """
  The TimeTracking context.
  """

  import Ecto.Query, warn: false
  alias TimeManagerPhx.Repo

  alias TimeManagerPhx.TimeTracking.WorkingTime
alias TimeManagerPhx.TimeTracking.Clock

  @doc """
  Returns the list of workingtimes.

  ## Examples

      iex> list_workingtimes()
      [%WorkingTime{}, ...]

  """
  def list_workingtimes do
    Repo.all(WorkingTime)
  end

  @doc """
  Gets a single working_time.

  Raises `Ecto.NoResultsError` if the Working time does not exist.

  ## Examples

      iex> get_working_time!(123)
      %WorkingTime{}

      iex> get_working_time!(456)
      ** (Ecto.NoResultsError)

  """
  def get_working_time!(id), do: Repo.get!(WorkingTime, id)

  @doc """
  Creates a working_time.

  ## Examples

      iex> create_working_time(%{field: value})
      {:ok, %WorkingTime{}}

      iex> create_working_time(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_working_time(attrs) do
    %WorkingTime{}
    |> WorkingTime.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a working_time.

  ## Examples

      iex> update_working_time(working_time, %{field: new_value})
      {:ok, %WorkingTime{}}

      iex> update_working_time(working_time, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_working_time(%WorkingTime{} = working_time, attrs) do
    working_time
    |> WorkingTime.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a working_time.

  ## Examples

      iex> delete_working_time(working_time)
      {:ok, %WorkingTime{}}

      iex> delete_working_time(working_time)
      {:error, %Ecto.Changeset{}}

  """
  def delete_working_time(%WorkingTime{} = working_time) do
    Repo.delete(working_time)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking working_time changes.

  ## Examples

      iex> change_working_time(working_time)
      %Ecto.Changeset{data: %WorkingTime{}}

  """
  def change_working_time(%WorkingTime{} = working_time, attrs \\ %{}) do
    WorkingTime.changeset(working_time, attrs)
  end

  # Clocks
  def list_clocks_for_user(user_id) do
    Repo.all(from c in Clock, where: c.user_id == ^user_id, order_by: [desc: c.time])
  end

  def create_clock(attrs) do
    %Clock{}
    |> Clock.changeset(attrs)
    |> Repo.insert()
  end

  def last_clock_for_user(user_id) do
    Repo.one(from c in Clock, where: c.user_id == ^user_id, order_by: [desc: c.time], limit: 1)
  end

  @doc """
  Deletes all time tracking data (clocks and workingtimes) for a given user.

  Returns :ok after attempting deletions.
  """
  def delete_all_for_user(user_id) do
    # Delete clocks first, then working times to satisfy any FK constraints
    Repo.delete_all(from c in Clock, where: c.user_id == ^user_id)
    Repo.delete_all(from w in WorkingTime, where: w.user_id == ^user_id)
    :ok
  end
end
