defmodule TimeManagerPhxWeb.WorkingTimeJSON do
  alias TimeManagerPhx.TimeTracking.WorkingTime

  @doc """
  Renders a list of workingtimes.
  """
  def index(%{workingtimes: workingtimes}) do
    %{data: for(working_time <- workingtimes, do: data(working_time))}
  end

  @doc """
  Renders a single working_time.
  """
  def show(%{working_time: working_time}) do
    %{data: data(working_time)}
  end

  defp data(%WorkingTime{} = working_time) do
    %{
      id: working_time.id,
      date: working_time.date,
      clock_in: working_time.clock_in,
      clock_out: working_time.clock_out,
      break_start: working_time.break_start,
      break_end: working_time.break_end,
      total_hours: working_time.total_hours,
      overtime: working_time.overtime,
      status: working_time.status,
      user_id: working_time.user_id,
      inserted_at: working_time.inserted_at,
      updated_at: working_time.updated_at
    }
  end
end
