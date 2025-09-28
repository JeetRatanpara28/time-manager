# TimeManagerPhx

## Main Concept

This Phoenix backend exposes a JSON API for a time manager app. The `Endpoint` (`lib/time_manager_phx_web/endpoint.ex`) assembles request plugs (static assets, JSON parsing, sessions) and delegates to the `Router` (`lib/time_manager_phx_web/router.ex`), which defines REST routes for users and custom endpoints for working times and clock toggle actions. Thin controllers (`UserController`, `WorkingTimeController`, `ClockController`) parse parameters and render JSON while delegating business and data access to contexts: `Accounts` handles users and `TimeTracking` manages working times and clocks. Persistence is done via Ecto schemas (`Accounts.User`, `TimeTracking.WorkingTime`, `TimeTracking.Clock`) using UUID keys and changesets for validation, with queries executed through `Repo`. A `FallbackController` provides uniform error responses for validation and not-found cases.

To start your Phoenix server:

* Run `mix setup` to install and setup dependencies
* Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Learn more

* Official website: https://www.phoenixframework.org/
* Guides: https://hexdocs.pm/phoenix/overview.html
* Docs: https://hexdocs.pm/phoenix
* Forum: https://elixirforum.com/c/phoenix-forum
* Source: https://github.com/phoenixframework/phoenix
