defmodule TimeManagerPhx.TimeTrackingFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `TimeManagerPhx.TimeTracking` context.
  """

  @doc """
  Generate a working_time.
  """
  def working_time_fixture(attrs \\ %{}) do
    {:ok, working_time} =
      attrs
      |> Enum.into(%{
        end: ~U[2025-09-23 20:06:00Z],
        start: ~U[2025-09-23 20:06:00Z]
      })
      |> TimeManagerPhx.TimeTracking.create_working_time()

    working_time
  end
end
