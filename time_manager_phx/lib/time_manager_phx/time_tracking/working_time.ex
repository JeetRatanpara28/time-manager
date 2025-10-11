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

  @valid_statuses ["active", "complete", "incomplete"]
  @standard_work_hours 8.0

  @doc false
  def changeset(working_time, attrs) do
    working_time
    |> cast(attrs, [:date, :clock_in, :clock_out, :break_start, :break_end, 
                    :total_hours, :overtime, :status, :user_id])
    |> validate_required([:date, :user_id])
    |> validate_inclusion(:status, @valid_statuses)
    |> handle_frontend_mappings(attrs)
    |> validate_time_logic()
    |> calculate_hours()
  end

  # Handle field mappings from Vue.js frontend
  defp handle_frontend_mappings(changeset, attrs) do
    changeset
    |> map_frontend_field(attrs, "start_time", :clock_in)
    |> map_frontend_field(attrs, "end_time", :clock_out)
  end

  # Generic field mapper
  defp map_frontend_field(changeset, attrs, from_key, to_field) do
    case Map.get(attrs, from_key) do
      nil -> changeset
      value -> put_change(changeset, to_field, value)
    end
  end

  # Validate time logic (clock_out after clock_in, break_end after break_start)
  defp validate_time_logic(changeset) do
    changeset
    |> validate_clock_times()
    |> validate_break_times()
  end

  defp validate_clock_times(changeset) do
    clock_in_str = get_field(changeset, :clock_in)
    clock_out_str = get_field(changeset, :clock_out)

    with {:ok, clock_in} <- parse_datetime_safe(clock_in_str),
         {:ok, clock_out} <- parse_datetime_safe(clock_out_str),
         true <- not is_nil(clock_in) and not is_nil(clock_out) do
      if DateTime.compare(clock_out, clock_in) == :gt do
        changeset
      else
        add_error(changeset, :clock_out, "must be after clock in time")
      end
    else
      _ -> changeset
    end
  end

  defp validate_break_times(changeset) do
    break_start_str = get_field(changeset, :break_start)
    break_end_str = get_field(changeset, :break_end)

    with {:ok, break_start} <- parse_datetime_safe(break_start_str),
         {:ok, break_end} <- parse_datetime_safe(break_end_str),
         true <- not is_nil(break_start) and not is_nil(break_end) do
      if DateTime.compare(break_end, break_start) == :gt do
        changeset
      else
        add_error(changeset, :break_end, "must be after break start time")
      end
    else
      _ -> changeset
    end
  end

  # Calculate total hours and overtime
  defp calculate_hours(changeset) do
    clock_in_str = get_field(changeset, :clock_in)
    clock_out_str = get_field(changeset, :clock_out)
    break_start_str = get_field(changeset, :break_start)
    break_end_str = get_field(changeset, :break_end)

    with {:ok, clock_in} <- parse_datetime_safe(clock_in_str),
         {:ok, clock_out} <- parse_datetime_safe(clock_out_str),
         true <- not is_nil(clock_in) and not is_nil(clock_out) do

      total_seconds = DateTime.diff(clock_out, clock_in)
      break_seconds = calculate_break_seconds(break_start_str, break_end_str)
      work_seconds = max(total_seconds - break_seconds, 0)

      total_hours = Decimal.from_float(work_seconds / 3600.0)
      overtime = calculate_overtime(total_hours)

      changeset
      |> put_change(:total_hours, total_hours)
      |> put_change(:overtime, overtime)
    else
      _ -> changeset
    end
  end

  # Calculate overtime hours
  defp calculate_overtime(total_hours) do
    standard_hours = Decimal.from_float(@standard_work_hours)
    
    if Decimal.compare(total_hours, standard_hours) == :gt do
      Decimal.sub(total_hours, standard_hours)
    else
      Decimal.new(0)
    end
  end

  # Calculate break time from string timestamps
  defp calculate_break_seconds(break_start_str, break_end_str) do
    with {:ok, break_start} <- parse_datetime_safe(break_start_str),
         {:ok, break_end} <- parse_datetime_safe(break_end_str),
         true <- not is_nil(break_start) and not is_nil(break_end) do
      DateTime.diff(break_end, break_start)
    else
      _ -> 0
    end
  end

  # Safe datetime parsing that returns {:ok, datetime} or {:error, reason}
  defp parse_datetime_safe(nil), do: {:ok, nil}
  defp parse_datetime_safe(""), do: {:ok, nil}
  defp parse_datetime_safe(datetime_string) when is_binary(datetime_string) do
    case DateTime.from_iso8601(datetime_string) do
      {:ok, datetime, _offset} -> 
        {:ok, datetime}
      {:error, _reason} ->
        parse_datetime_without_timezone(datetime_string)
    end
  end
  defp parse_datetime_safe(_), do: {:error, :invalid_format}

  # Parse datetime strings without timezone information
  defp parse_datetime_without_timezone(datetime_string) do
    with [date_part, time_part] <- String.split(datetime_string, "T"),
         {:ok, date} <- parse_date_part(date_part),
         {:ok, time} <- parse_time_part(time_part),
         {:ok, datetime} <- DateTime.new(date, time, "Etc/UTC") do
      {:ok, datetime}
    else
      _ -> {:error, :invalid_datetime_format}
    end
  end

  defp parse_date_part(date_string) do
    with [year_str, month_str, day_str] <- String.split(date_string, "-"),
         {year, ""} <- Integer.parse(year_str),
         {month, ""} <- Integer.parse(month_str),
         {day, ""} <- Integer.parse(day_str) do
      Date.new(year, month, day)
    else
      _ -> {:error, :invalid_date}
    end
  end

  defp parse_time_part(time_string) do
    # Handle seconds with or without fractional part
    time_parts = String.split(time_string, ":")
    
    case time_parts do
      [hour_str, minute_str, second_str] ->
        with {hour, ""} <- Integer.parse(hour_str),
             {minute, ""} <- Integer.parse(minute_str),
             {second, _} <- parse_seconds(second_str) do
          Time.new(hour, minute, second)
        else
          _ -> {:error, :invalid_time}
        end
      _ -> {:error, :invalid_time}
    end
  end

  defp parse_seconds(second_str) do
    # Handle both "31" and "31.123" formats
    case String.split(second_str, ".") do
      [seconds] -> Integer.parse(seconds)
      [seconds, _fractional] -> Integer.parse(seconds)
      _ -> :error
    end
  end
end
