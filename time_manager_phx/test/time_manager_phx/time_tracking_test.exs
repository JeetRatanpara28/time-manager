defmodule TimeManagerPhx.TimeTrackingTest do
  use TimeManagerPhx.DataCase

  alias TimeManagerPhx.TimeTracking

  describe "workingtimes" do
    alias TimeManagerPhx.TimeTracking.WorkingTime

    import TimeManagerPhx.TimeTrackingFixtures

    @invalid_attrs %{start: nil, end: nil}

    test "list_workingtimes/0 returns all workingtimes" do
      working_time = working_time_fixture()
      assert TimeTracking.list_workingtimes() == [working_time]
    end

    test "get_working_time!/1 returns the working_time with given id" do
      working_time = working_time_fixture()
      assert TimeTracking.get_working_time!(working_time.id) == working_time
    end

    test "create_working_time/1 with valid data creates a working_time" do
      valid_attrs = %{start: ~U[2025-09-23 20:06:00Z], end: ~U[2025-09-23 20:06:00Z]}

      assert {:ok, %WorkingTime{} = working_time} = TimeTracking.create_working_time(valid_attrs)
      assert working_time.start == ~U[2025-09-23 20:06:00Z]
      assert working_time.end == ~U[2025-09-23 20:06:00Z]
    end

    test "create_working_time/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = TimeTracking.create_working_time(@invalid_attrs)
    end

    test "update_working_time/2 with valid data updates the working_time" do
      working_time = working_time_fixture()
      update_attrs = %{start: ~U[2025-09-24 20:06:00Z], end: ~U[2025-09-24 20:06:00Z]}

      assert {:ok, %WorkingTime{} = working_time} = TimeTracking.update_working_time(working_time, update_attrs)
      assert working_time.start == ~U[2025-09-24 20:06:00Z]
      assert working_time.end == ~U[2025-09-24 20:06:00Z]
    end

    test "update_working_time/2 with invalid data returns error changeset" do
      working_time = working_time_fixture()
      assert {:error, %Ecto.Changeset{}} = TimeTracking.update_working_time(working_time, @invalid_attrs)
      assert working_time == TimeTracking.get_working_time!(working_time.id)
    end

    test "delete_working_time/1 deletes the working_time" do
      working_time = working_time_fixture()
      assert {:ok, %WorkingTime{}} = TimeTracking.delete_working_time(working_time)
      assert_raise Ecto.NoResultsError, fn -> TimeTracking.get_working_time!(working_time.id) end
    end

    test "change_working_time/1 returns a working_time changeset" do
      working_time = working_time_fixture()
      assert %Ecto.Changeset{} = TimeTracking.change_working_time(working_time)
    end
  end
end
