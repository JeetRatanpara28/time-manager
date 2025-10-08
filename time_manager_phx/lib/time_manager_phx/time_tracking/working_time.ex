defmodule TimeManagerPhx.TimeTracking.WorkingTime do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "workingtimes" do
    field :date, :date
    field :clock_in, :string     # Store as ISO string
    field :clock_out, :string    # Store as ISO string
    field :break_start, :string
    field :break_end, :string
    field :total_hours, :decimal
    field :overtime, :decimal
    field :status, :string, default: "active" # active, complete, incomplete
    field :user_id, :binary_id

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(working_time, attrs) do
    working_time
    |> cast(attrs, [:date, :break_start, :break_end, :total_hours, :overtime, :status, :user_id])
    |> validate_required([:date, :user_id])
    |> validate_inclusion(:status, ["active", "complete", "incomplete"])
    |> handle_frontend_mappings(attrs)
    |> calculate_hours()
  end

  # Handle field mappings from Vue.js frontend
  defp handle_frontend_mappings(changeset, attrs) do
    changeset
    |> handle_start_time_mapping(attrs)
    |> handle_end_time_mapping(attrs)
    |> handle_break_time_mappings(attrs)
  end

  # Map start_time from frontend to clock_in
  defp handle_start_time_mapping(changeset, %{"start_time" => start_time}) do
    put_change(changeset, :clock_in, start_time)
  end
  defp handle_start_time_mapping(changeset, _), do: changeset

  # Map end_time from frontend to clock_out
  defp handle_end_time_mapping(changeset, %{"end_time" => end_time}) do
    put_change(changeset, :clock_out, end_time)
  end
  defp handle_end_time_mapping(changeset, _), do: changeset

  # Handle break times
  defp handle_break_time_mappings(changeset, %{"break_start" => break_start}) do
    put_change(changeset, :break_start, break_start)
  end
  defp handle_break_time_mappings(changeset, %{"break_end" => break_end}) do
    put_change(changeset, :break_end, break_end)
  end
  defp handle_break_time_mappings(changeset, _), do: changeset

  # Calculate total hours and overtime
  defp calculate_hours(changeset) do
    clock_in_str = get_field(changeset, :clock_in)
    clock_out_str = get_field(changeset, :clock_out)
    break_start_str = get_field(changeset, :break_start)
    break_end_str = get_field(changeset, :break_end)

    # Parse datetime strings to DateTime objects for calculations
    with {:ok, clock_in} when not is_nil(clock_in) <- parse_datetime_safe(clock_in_str),
         {:ok, clock_out} when not is_nil(clock_out) <- parse_datetime_safe(clock_out_str) do

      # Calculate total work time in seconds
      total_seconds = DateTime.diff(clock_out, clock_in)

      # Calculate break time in seconds
      break_seconds = calculate_break_seconds(break_start_str, break_end_str)

      # Work time = total time - break time
      work_seconds = total_seconds - break_seconds

      # Convert to hours (decimal)
      total_hours = work_seconds / 3600.0

      # Calculate overtime (assuming 8 hours is standard)
      overtime = if total_hours > 8.0 do
        total_hours - 8.0
      else
        0.0
      end

      changeset
      |> put_change(:total_hours, total_hours)
      |> put_change(:overtime, overtime)
    else
      _ ->
        # If we don't have both clock_in and clock_out, don't calculate
        changeset
    end
  end

  # Calculate break time from string timestamps
  defp calculate_break_seconds(nil, _), do: 0
  defp calculate_break_seconds(_, nil), do: 0
  defp calculate_break_seconds(break_start_str, break_end_str) do
    with {:ok, break_start} <- parse_datetime_safe(break_start_str),
         {:ok, break_end} <- parse_datetime_safe(break_end_str) do
      DateTime.diff(break_end, break_start)
    else
      _ -> 0
    end
  end

  # Safe datetime parsing that returns {:ok, datetime} or :error
  defp parse_datetime_safe(nil), do: {:ok, nil}
  defp parse_datetime_safe(""), do: {:ok, nil}
  defp parse_datetime_safe(datetime_string) do
    # Try to parse with DateTime.from_iso8601 first
    case DateTime.from_iso8601(datetime_string) do
      {:ok, datetime, _} -> {:ok, datetime}
      _ ->
        # If that fails, try manual parsing for partial ISO strings
        try_manual_parse(datetime_string)
    end
  end

  # Manual parsing for incomplete ISO strings like "2025-10-05T15:24:31"
  defp try_manual_parse(datetime_string) do
    try do
      # Parse the datetime string manually
      [date_part, time_part] = String.split(datetime_string, "T")
      [year, month, day] = String.split(date_part, "-") |> Enum.map(&String.to_integer/1)
      [hour, minute, second] = String.split(time_part, ":") |> Enum.map(&String.to_integer/1)

      # Create DateTime with UTC timezone
      {:ok, date} = Date.new(year, month, day)
      {:ok, time} = Time.new(hour, minute, second)
      {:ok, datetime} = DateTime.new(date, time, "Etc/UTC")

      {:ok, datetime}
    rescue
      _ -> :error
    end
  end
end
