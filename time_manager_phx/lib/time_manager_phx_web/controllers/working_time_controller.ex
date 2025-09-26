defmodule TimeManagerPhxWeb.WorkingTimeController do
  use TimeManagerPhxWeb, :controller

  alias TimeManagerPhx.TimeTracking
  alias TimeManagerPhx.TimeTracking.WorkingTime

  action_fallback TimeManagerPhxWeb.FallbackController

  # GET /api/workingtime/:userID?start=XXX&end=YYY
  def index(conn, %{"user_id" => user_id} = params) do
    start_str = Map.get(params, "start")
    end_str = Map.get(params, "end")
    base = TimeTracking.list_workingtimes()
    |> Enum.filter(&(&1.user_id == user_id))
    |> Enum.sort_by(& &1.start)

    list =
      case {start_str, end_str} do
        {nil, nil} -> base
        {s, nil} ->
          {:ok, sdt, _} = DateTime.from_iso8601(String.replace(s, " ", "T") <> "Z")
          Enum.filter(base, &DateTime.compare(&1.start, sdt) != :lt)
        {nil, e} ->
          {:ok, edt, _} = DateTime.from_iso8601(String.replace(e, " ", "T") <> "Z")
          Enum.filter(base, &DateTime.compare(&1.end, edt) != :gt)
        {s, e} ->
          {:ok, sdt, _} = DateTime.from_iso8601(String.replace(s, " ", "T") <> "Z")
          {:ok, edt, _} = DateTime.from_iso8601(String.replace(e, " ", "T") <> "Z")
          Enum.filter(base, fn w -> DateTime.compare(w.start, sdt) != :lt and DateTime.compare(w.end, edt) != :gt end)
      end
    render(conn, :index, workingtimes: list)
  end

  # POST /api/workingtime/:userID
  def create(conn, %{"user_id" => user_id, "working_time" => working_time_params}) do
    working_time_params = Map.put(working_time_params, "user_id", user_id)
    with {:ok, %WorkingTime{} = working_time} <- TimeTracking.create_working_time(working_time_params) do
      conn
      |> put_status(:created)
      |> render(:show, working_time: working_time)
    end
  end

  # GET /api/workingtime/:userID/:id
  def show(conn, %{"user_id" => user_id, "id" => id}) do
    working_time = TimeTracking.get_working_time!(id)
    if working_time.user_id != user_id, do: send_resp(conn, :not_found, ""), else: render(conn, :show, working_time: working_time)
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
end
