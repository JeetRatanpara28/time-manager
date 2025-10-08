defmodule TimeManagerPhxWeb.Router do
  use TimeManagerPhxWeb, :router

  pipeline :api do
    plug CORSPlug,
      origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      headers: [
        "Accept",
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "Origin",
        "Referer",
        "User-Agent"
      ],
      credentials: true,
      max_age: 86400,  # 24 hours
      send_preflight_response?: true
    plug :accepts, ["json"]
  end

  pipeline :auth do
    plug TimeManagerPhxWeb.Plugs.JWTAuth
  end

  pipeline :require_gm do
    plug TimeManagerPhxWeb.Plugs.JWTAuth
    plug TimeManagerPhxWeb.Plugs.Authorize, ["general_manager"]
  end

  scope "/", TimeManagerPhxWeb do
    pipe_through :api

    get "/", PageController, :index
  end

  scope "/api", TimeManagerPhxWeb do
    pipe_through :api

    # Authentication routes (public)
    post "/auth/login", AuthController, :login
    post "/auth/register", AuthController, :register
    post "/auth/refresh", AuthController, :refresh
    delete "/auth/logout", AuthController, :logout

    # Protected user profile route
    get "/auth/profile", AuthController, :profile

    # CORS preflight handling
    options "/", PageController, :options
    options "/users", UserController, :options
    options "/users/*path", UserController, :options
    options "/workingtimes", WorkingTimeController, :options
    options "/workingtimes/*path", WorkingTimeController, :options
    options "/dashboard/*path", UserController, :options
    options "/auth/*path", AuthController, :options

    # User management routes - Require authentication
    scope "/" do
      pipe_through :auth

      # User management routes - Full CRUD (requires authentication)
      resources "/users", UserController, except: [:new, :edit]

      # Working time routes - Full CRUD (requires authentication)
      resources "/workingtimes", WorkingTimeController, except: [:new, :edit]

      # Additional working time routes for dashboard
      get "/workingtimes/today/:user_id", WorkingTimeController, :today
      get "/workingtimes/stats/:user_id", WorkingTimeController, :stats

      # GM Dashboard specific routes - Require GM role
      scope "/" do
        pipe_through :require_gm

        # GM Dashboard statistics (only GM can access)
        get "/dashboard/stats", UserController, :stats
      end
    end
  end

  # Enable Swoosh mailbox preview in development
  if Application.compile_env(:time_manager_phx, :dev_routes) do
    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
