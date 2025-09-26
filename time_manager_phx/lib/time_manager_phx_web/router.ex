defmodule TimeManagerPhxWeb.Router do
  use TimeManagerPhxWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", TimeManagerPhxWeb do
    pipe_through :api
    resources "/users", UserController, except: [:new, :edit]
    # WorkingTime routes per PDF
    get "/workingtime/:user_id", WorkingTimeController, :index
    get "/workingtime/:user_id/:id", WorkingTimeController, :show
    post "/workingtime/:user_id", WorkingTimeController, :create
    put "/workingtime/:id", WorkingTimeController, :update
    delete "/workingtime/:id", WorkingTimeController, :delete
    # Clocks as per PDF
    get "/clocks/:user_id", ClockController, :index
    post "/clocks/:user_id", ClockController, :create
  end

  # Enable Swoosh mailbox preview in development
  if Application.compile_env(:time_manager_phx, :dev_routes) do

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
