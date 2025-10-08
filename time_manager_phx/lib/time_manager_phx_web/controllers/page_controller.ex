defmodule TimeManagerPhxWeb.PageController do
  use TimeManagerPhxWeb, :controller

  def index(conn, _params) do
    conn
    |> put_resp_header("access-control-allow-origin", "http://localhost:5173")
    |> put_resp_header("access-control-allow-credentials", "true")
    |> send_resp(200, "Time Manager API Server")
  end

  def options(conn, _params) do
    conn
    |> put_resp_header("access-control-allow-origin", "http://localhost:5173")
    |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS")
    |> put_resp_header("access-control-allow-headers", "Content-Type, Authorization, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since")
    |> put_resp_header("access-control-max-age", "1728000")
    |> send_resp(204, "")
  end
end
