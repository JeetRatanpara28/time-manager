import React, { useState } from 'react';
import { ClockControls } from './ClockControls';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, Coffee, TrendingUp, Download, Eye, UserPlus, Edit3 } from 'lucide-react';
import { useAppContext, User } from '../App';

export function ManagerDashboard() {
  const { currentUser, users, timeEntries } = useAppContext();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  // Filter employees (exclude managers and GMs)
  const employees = users.filter(user => user.role === 'employee');
  
  // Filter time entries based on selection
  const filteredEntries = selectedEmployee === 'all' 
    ? timeEntries.filter(entry => employees.some(emp => emp.id === entry.userId))
    : timeEntries.filter(entry => entry.userId === selectedEmployee);

  // Calculate team stats
  const onlineEmployees = employees.filter(emp => emp.isOnline).length;
  const onBreakEmployees = employees.filter(emp => emp.isOnline).length; // Mock data
  const totalHoursToday = filteredEntries
    .filter(entry => entry.date === new Date().toISOString().split('T')[0])
    .reduce((sum, entry) => sum + entry.totalHours, 0);

  // Mock chart data
  const employeeHoursData = employees.map(emp => ({
    name: emp.name.split(' ')[0],
    hours: timeEntries
      .filter(entry => entry.userId === emp.id)
      .reduce((sum, entry) => sum + entry.totalHours, 0)
  }));

  const weeklyProductivityData = [
    { week: 'Week 1', productivity: 85 },
    { week: 'Week 2', productivity: 88 },
    { week: 'Week 3', productivity: 82 },
    { week: 'Week 4', productivity: 90 },
  ];

  const breakUsageData = [
    { name: 'Used Break Time', value: 60, color: '#FF9800' },
    { name: 'Remaining Break Time', value: 40, color: '#E0E0E0' },
  ];

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Employee,Date,Clock In,Clock Out,Break Hours,Total Hours\n"
      + filteredEntries.map(entry => {
          const employee = users.find(u => u.id === entry.userId);
          return `${employee?.name},${entry.date},${entry.clockIn || ''},${entry.clockOut || ''},${entry.breakHours},${entry.totalHours}`;
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_time_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor team performance and manage employee schedules</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleExportCSV} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Employees Online</p>
                <p className="text-xl font-semibold text-green-900">{onlineEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Coffee className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600">On Break</p>
                <p className="text-xl font-semibold text-orange-900">{Math.floor(onBreakEmployees / 2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Total Hours Today</p>
                <p className="text-xl font-semibold text-blue-900">{totalHoursToday.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Team Efficiency</p>
                <p className="text-xl font-semibold text-purple-900">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Clock Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Personal Time Clock</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClockControls size="medium" />
        </CardContent>
      </Card>

      {/* Employee Management and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Status */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employees.map(employee => (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{employee.name}</p>
                      <p className="text-sm text-gray-500">{employee.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={employee.isOnline ? "default" : "secondary"} 
                           className={employee.isOnline ? "bg-green-100 text-green-700" : ""}>
                      {employee.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employee Logs Filter and Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Employee Activity Logs</CardTitle>
              <select 
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Employee</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Clock In</th>
                    <th className="text-left py-3 px-4">Clock Out</th>
                    <th className="text-left py-3 px-4">Total Hours</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.slice(0, 5).map((entry, index) => {
                    const employee = users.find(u => u.id === entry.userId);
                    return (
                      <tr key={entry.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4 font-medium">{employee?.name}</td>
                        <td className="py-3 px-4">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{entry.clockIn || '-'}</td>
                        <td className="py-3 px-4">{entry.clockOut || '-'}</td>
                        <td className="py-3 px-4">{entry.totalHours}h</td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Hours Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={employeeHoursData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="hours" fill="#4A90E2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Productivity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyProductivityData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="week" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="productivity" 
                  stroke="#6A4FC7" 
                  strokeWidth={3}
                  dot={{ fill: '#6A4FC7', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Break Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Team Break Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={breakUsageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {breakUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {breakUsageData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}