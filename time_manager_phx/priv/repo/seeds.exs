# priv/repo/seeds.exs
alias TimeManagerPhx.Repo
alias TimeManagerPhx.Accounts.User
alias TimeManagerPhx.TimeTracking.WorkingTime

# Clear existing data
Repo.delete_all(WorkingTime)
Repo.delete_all(User)

IO.puts("🌱 Seeding database...")

# ========================================
# CREATE GENERAL MANAGER
# ========================================
{:ok, gm} = %User{}
|> User.registration_changeset(%{
  username: "gm_admin",
  email: "gm@example.com",
  password: "password123",
  name: "Alex General Manager",
  role: "general_manager",
  department: "Executive",
  phone: "+1-555-0100",
  status: "online",
  bio: "Chief Executive overseeing all departments"
})
|> Repo.insert()

IO.puts("✅ Created GM: #{gm.email}")

# ========================================
# CREATE MANAGERS
# ========================================
{:ok, manager1} = %User{}
|> User.registration_changeset(%{
  username: "manager_john",
  email: "manager@example.com",
  password: "password123",
  name: "John Manager",
  role: "manager",
  department: "Engineering",
  phone: "+1-555-0101",
  status: "online",
  bio: "Engineering team manager"
})
|> Repo.insert()

IO.puts("✅ Created Manager: #{manager1.email}")

{:ok, manager2} = %User{}
|> User.registration_changeset(%{
  username: "manager_sarah",
  email: "sarah.manager@example.com",
  password: "password123",
  name: "Sarah Williams",
  role: "manager",
  department: "Marketing",
  phone: "+1-555-0102",
  status: "offline",
  bio: "Marketing team lead"
})
|> Repo.insert()

IO.puts("✅ Created Manager: #{manager2.email}")

# ========================================
# CREATE EMPLOYEES
# ========================================
{:ok, employee1} = %User{}
|> User.registration_changeset(%{
  username: "emp_alice",
  email: "employee@example.com",
  password: "password123",
  name: "Alice Smith",
  role: "employee",
  department: "Engineering",
  phone: "+1-555-0201",
  status: "online",
  bio: "Senior Software Engineer"
})
|> Repo.insert()

IO.puts("✅ Created Employee: #{employee1.email}")

{:ok, employee2} = %User{}
|> User.registration_changeset(%{
  username: "emp_bob",
  email: "bob@example.com",
  password: "password123",
  name: "Bob Developer",
  role: "employee",
  department: "Engineering",
  phone: "+1-555-0202",
  status: "online",
  bio: "Frontend developer"
})
|> Repo.insert()

IO.puts("✅ Created Employee: #{employee2.email}")

{:ok, employee3} = %User{}
|> User.registration_changeset(%{
  username: "emp_carol",
  email: "carol@example.com",
  password: "password123",
  name: "Carol Designer",
  role: "employee",
  department: "Marketing",
  phone: "+1-555-0203",
  status: "offline",
  bio: "Creative designer"
})
|> Repo.insert()

IO.puts("✅ Created Employee: #{employee3.email}")

# ========================================
# CREATE SAMPLE WORKING TIME LOGS
# ========================================
IO.puts("\n📊 Creating sample working time logs...")

today = Date.utc_today()

# Create logs for past 7 days for Alice
for days_ago <- 0..6 do
  work_date = Date.add(today, -days_ago)
  
  {:ok, _wt} = %WorkingTime{}
  |> WorkingTime.changeset(%{
    user_id: employee1.id,
    date: work_date,
    clock_in: "#{work_date}T09:00:00Z",
    clock_out: "#{work_date}T17:30:00Z",
    status: "complete"
  })
  |> Repo.insert()
end

IO.puts("✅ Created working time logs for Alice")

# Create logs for Bob
for days_ago <- 0..6 do
  work_date = Date.add(today, -days_ago)
  
  {:ok, _wt} = %WorkingTime{}
  |> WorkingTime.changeset(%{
    user_id: employee2.id,
    date: work_date,
    clock_in: "#{work_date}T10:00:00Z",
    clock_out: "#{work_date}T19:00:00Z",
    status: "complete"
  })
  |> Repo.insert()
end

IO.puts("✅ Created working time logs for Bob")

# ========================================
# SUMMARY
# ========================================
IO.puts("\n" <> String.duplicate("=", 60))
IO.puts("🎉 Database seeding complete!")
IO.puts(String.duplicate("=", 60))

IO.puts("\n📋 Test Credentials:")
IO.puts("\n👔 General Manager:")
IO.puts("   Email: gm@example.com")
IO.puts("   Password: password123")

IO.puts("\n👨‍💼 Manager:")
IO.puts("   Email: manager@example.com")
IO.puts("   Password: password123")

IO.puts("\n👷 Employee:")
IO.puts("   Email: employee@example.com")
IO.puts("   Password: password123")

IO.puts("\n" <> String.duplicate("=", 60))
IO.puts("📊 Stats:")
IO.puts("   Users: #{Repo.aggregate(User, :count)}")
IO.puts("   Working Times: #{Repo.aggregate(WorkingTime, :count)}")
IO.puts(String.duplicate("=", 60) <> "\n")