# Seed script to add GM user
alias TimeManagerPhx.Accounts
alias TimeManagerPhx.Repo

# Create GM user
gm_attrs = %{
  username: "gm1",
  email: "gm@company.com",
  name: "General Manager 1",
  role: "general_manager",
  department: "Management",
  phone: "+1-555-0100",
  status: "online",
  bio: "General Manager responsible for overseeing all operations"
}

# Create the GM user
case Accounts.create_user(gm_attrs) do
  {:ok, user} ->
    IO.puts("✅ Created GM user: #{user.name} (#{user.username})")
    IO.puts("   Email: #{user.email}")
    IO.puts("   Role: #{user.role}")
    IO.puts("   Department: #{user.department}")

  {:error, changeset} ->
    IO.puts("❌ Failed to create GM user:")
    Enum.each(changeset.errors, fn {field, {message, _}} ->
      IO.puts("   #{field}: #{message}")
    end)
end

# Create some sample employees
employees = [
  %{
    username: "emp1",
    email: "john.doe@company.com",
    name: "John Doe",
    role: "employee",
    department: "Engineering",
    phone: "+1-555-1001",
    status: "online",
    bio: "Software Engineer"
  },
  %{
    username: "emp2",
    email: "jane.smith@company.com",
    name: "Jane Smith",
    role: "employee",
    department: "Marketing",
    phone: "+1-555-1002",
    status: "offline",
    bio: "Marketing Specialist"
  },
  %{
    username: "mgr1",
    email: "mike.johnson@company.com",
    name: "Mike Johnson",
    role: "manager",
    department: "Engineering",
    phone: "+1-555-2001",
    status: "online",
    bio: "Engineering Manager"
  }
]

Enum.each(employees, fn emp_attrs ->
  case Accounts.create_user(emp_attrs) do
    {:ok, user} ->
      IO.puts("✅ Created #{user.role}: #{user.name} (#{user.username})")
    {:error, changeset} ->
      IO.puts("❌ Failed to create #{emp_attrs.username}: #{inspect(changeset.errors)}")
  end
end)

IO.puts("\n🎉 Database seeded successfully!")
IO.puts("📋 Summary:")
IO.puts("   • 1 General Manager")
IO.puts("   • 1 Manager")
IO.puts("   • 2 Employees")
IO.puts("   • Total: 4 users created")
