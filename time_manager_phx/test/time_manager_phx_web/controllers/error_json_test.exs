defmodule TimeManagerPhxWeb.ErrorJSONTest do
  use TimeManagerPhxWeb.ConnCase, async: true

  test "renders 404" do
    assert TimeManagerPhxWeb.ErrorJSON.render("404.json", %{}) == %{errors: %{detail: "Not Found"}}
  end

  test "renders 500" do
    assert TimeManagerPhxWeb.ErrorJSON.render("500.json", %{}) ==
             %{errors: %{detail: "Internal Server Error"}}
  end
end
