import React, { useState } from 'react';
import { ClockControls } from './ClockControls';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Clock, Coffee, TrendingUp, Download, Eye, UserPlus, Edit3, DollarSign, Target, Zap } from 'lucide-react';
import { useAppContext, User } from '../App';

export function GeneralManagerDashboard() {
  const { currentUser, users, timeEntries } = useAppContext();
  const [selectedDateRange, setSelectedDateRange] = useState('week');
  const [selectedUser, setSelectedUser] = useState('all');

  // Filter users based on selection
  const allUsers = users.filter(user => user.id !== currentUser.id);
  const filteredEntries = selectedUser === 'all' 
    ? timeEntries.filter(entry => entry.userId !== currentUser.id)
    : timeEntries.filter(entry => entry.userId === selectedUser);

  // Calculate company-wide KPIs
  const totalUsers = allUsers.length;
  const onlineUsers = allUsers.filter(user => user.isOnline).length;
  const totalHoursToday = timeEntries
    .filter(entry => entry.date === new Date().toISOString().split('T')[0])
    .reduce((sum, entry) => sum + entry.totalHours, 0);
  const overtimeHours = totalHoursToday > (totalUsers * 8) ? totalHoursToday - (totalUsers * 8) : 0;

  // Mock KPI data
  const departmentData = [
    { name: 'Engineering', employees: 8, hours: 65.5, efficiency: 92 },
    { name: 'Design', employees: 4, hours: 30.2, efficiency: 88 },
    { name: 'Marketing', employees: 3, hours: 22.8, efficiency: 85 },
    { name: 'Operations', employees: 2, hours: 15.5, efficiency: 90 },
  ];

  const monthlyTrendData = [
    { month: 'Jan', hours: 1840, cost: 92000, productivity: 88 },
    { month: 'Feb', hours: 1760, cost: 88000, productivity: 85 },
    { month: 'Mar', hours: 1920, cost: 96000, productivity: 92 },
    { month: 'Apr', hours: 1880, cost: 94000, productivity: 90 },
  ];

  const performanceRadarData = [
    { subject: 'Productivity', A: 90, fullMark: 100 },
    { subject: 'Attendance', A: 85, fullMark: 100 },
    { subject: 'Efficiency', A: 88, fullMark: 100 },
    { subject: 'Collaboration', A: 92, fullMark: 100 },
    { subject: 'Innovation', A: 87, fullMark: 100 },
    { subject: 'Quality', A: 89, fullMark: 100 },
  ];

  const costBreakdownData = [
    { name: 'Salaries', value: 75, color: '#4A90E2' },
    { name: 'Benefits', value: 15, color: '#6A4FC7' },
    { name: 'Overtime', value: 10, color: '#FF9800' },
  ];

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "User,Role,Date,Clock In,Clock Out,Break Hours,Total Hours\n"
      + filteredEntries.map(entry => {
          const user = users.find(u => u.id === entry.userId);
          return `${user?.name},${user?.role},${entry.date},${entry.clockIn || ''},${entry.clockOut || ''},${entry.breakHours},${entry.totalHours}`;
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "company_time_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete overview of company time management and performance</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <Button onClick={handleExportCSV} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Total Employees</p>
                <p className="text-xl font-semibold text-blue-900">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Active Now</p>
                <p className="text-xl font-semibold text-green-900">{onlineUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Total Hours</p>
                <p className="text-xl font-semibold text-purple-900">{totalHoursToday.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600">Overtime</p>
                <p className="text-xl font-semibold text-orange-900">{overtimeHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-600">Labor Cost</p>
                <p className="text-xl font-semibold text-emerald-900">$94K</p>
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

      {/* Department Overview and User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentData.map(dept => (
                <div key={dept.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{dept.name}</h4>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {dept.efficiency}% Efficiency
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Employees</p>
                      <p className="font-medium">{dept.employees}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Hours</p>
                      <p className="font-medium">{dept.hours}h</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg/Employee</p>
                      <p className="font-medium">{(dept.hours / dept.employees).toFixed(1)}h</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {allUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{user.role.replace('_', ' ')} • {user.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={user.isOnline ? "default" : "secondary"} 
                           className={user.isOnline ? "bg-green-100 text-green-700" : ""}>
                      {user.isOnline ? 'Online' : 'Offline'}
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
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-sm" />
                <YAxis yAxisId="left" className="text-sm" />
                <YAxis yAxisId="right" orientation="right" className="text-sm" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
                <Line yAxisId="left" type="monotone" dataKey="hours" stroke="#4A90E2" strokeWidth={3} name="Hours" />
                <Line yAxisId="right" type="monotone" dataKey="productivity" stroke="#6A4FC7" strokeWidth={3} name="Productivity %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Company Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" className="text-sm" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-sm" />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="#4A90E2"
                  fill="#4A90E2"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Department Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" className="text-sm" angle={-45} textAnchor="end" height={80} />
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

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Labor Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costBreakdownData.map((entry, index) => (
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
              {costBreakdownData.map((entry, index) => (
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

        {/* Recent Activity Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <select 
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Users</option>
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {filteredEntries.slice(0, 8).map((entry, index) => {
                const user = users.find(u => u.id === entry.userId);
                return (
                  <div key={entry.id} className="flex items-center justify-between p-2 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{entry.totalHours}h</p>
                      <p className="text-xs text-gray-500">{entry.clockIn} - {entry.clockOut}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}