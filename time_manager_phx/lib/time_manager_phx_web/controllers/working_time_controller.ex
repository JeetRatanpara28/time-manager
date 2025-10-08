defmodule TimeManagerPhxWeb.WorkingTimeController do
  use TimeManagerPhxWeb, :controller

  alias TimeManagerPhx.TimeTracking
  alias TimeManagerPhx.TimeTracking.WorkingTime

  action_fallback TimeManagerPhxWeb.FallbackController

  # GET /api/workingtimes?user_id=XXX&start_date=XXX&end_date=YYY
  def index(conn, params) do
    user_id = Map.get(params, "user_id")
    start_date = Map.get(params, "start_date")
    end_date = Map.get(params, "end_date")

    base_query = TimeTracking.list_workingtimes()

    # Filter by user if provided
    filtered_query =
      if user_id do
        Enum.filter(base_query, &(&1.user_id == user_id))
      else
        base_query
      end

    # Filter by date range if provided
    filtered_query =
      case {start_date, end_date} do
        {nil, nil} -> filtered_query
        {start_date, nil} ->
          {:ok, start_dt} = Date.from_iso8601(start_date)
          Enum.filter(filtered_query, &Date.compare(&1.date, start_dt) != :lt)
        {nil, end_date} ->
          {:ok, end_dt} = Date.from_iso8601(end_date)
          Enum.filter(filtered_query, &Date.compare(&1.date, end_dt) != :gt)
        {start_date, end_date} ->
          {:ok, start_dt} = Date.from_iso8601(start_date)
          {:ok, end_dt} = Date.from_iso8601(end_date)
          Enum.filter(filtered_query, fn wt ->
            Date.compare(wt.date, start_dt) != :lt && Date.compare(wt.date, end_dt) != :gt
          end)
      end

    # Sort by date (newest first)
    sorted_list = Enum.sort_by(filtered_query, & &1.date, {:desc, Date})

    render(conn, :index, workingtimes: sorted_list)
  end

  # POST /api/workingtimes
  def create(conn, %{"working_time" => working_time_params}) do
    with {:ok, %WorkingTime{} = working_time} <- TimeTracking.create_working_time(working_time_params) do
      conn
      |> put_status(:created)
      |> render(:show, working_time: working_time)
    end
  end

  # GET /api/workingtimes/:id
  def show(conn, %{"id" => id}) do
    working_time = TimeTracking.get_working_time!(id)
    render(conn, :show, working_time: working_time)
  end

  def update(conn, %{"id" => id, "working_time" => working_time_params}) do
    working_time = TimeTracking.get_working_time!(id)

    with {:ok, %WorkingTime{} = working_time} <- TimeTracking.update_working_time(working_time, working_time_params) do
      render(conn, :show, working_time: working_time)
    end
  end

  def delete(conn, %{"id" => id}) do
    working_time = TimeTracking.get_working_time!(id)

    with {:ok, %WorkingTime{}} <- TimeTracking.delete_working_time(working_time) do
      send_resp(conn, :no_content, "")
    end
  end

  # GET /api/workingtimes/today/:user_id
  def today(conn, %{"user_id" => user_id}) do
    today = Date.utc_today()
    today_logs = TimeTracking.list_workingtimes()
    |> Enum.filter(&(&1.user_id == user_id && Date.compare(&1.date, today) == :eq))

    render(conn, :index, workingtimes: today_logs)
  end

  # GET /api/workingtimes/stats/:user_id
  def stats(conn, %{"user_id" => user_id}) do
    user_logs = TimeTracking.list_workingtimes()
    |> Enum.filter(&(&1.user_id == user_id))

    stats = %{
      total_logs: length(user_logs),
      total_hours: Enum.reduce(user_logs, Decimal.new(0), fn log, acc ->
        case log.total_hours do
          nil -> acc
          hours -> Decimal.add(acc, hours)
        end
      end),
      active_sessions: Enum.count(user_logs, &(&1.status == "active")),
      completed_sessions: Enum.count(user_logs, &(&1.status == "complete"))
    }

    json(conn, stats)
  end

  # Handle CORS preflight OPTIONS requests
  def options(conn, _params) do
    conn
    |> put_resp_header("access-control-allow-origin", "http://localhost:5173")
    |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS")
    |> put_resp_header("access-control-allow-headers", "Content-Type, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since")
    |> put_resp_header("access-control-max-age", "1728000")
    |> send_resp(204, "")
  end
end
