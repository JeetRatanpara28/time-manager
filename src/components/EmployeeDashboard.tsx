import React from 'react';
import { ClockControls } from './ClockControls';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, Coffee, TrendingUp } from 'lucide-react';
import { useAppContext } from '../App';

export function EmployeeDashboard() {
  const { currentUser, timeEntries } = useAppContext();

  // Filter entries for current user
  const userEntries = timeEntries.filter(entry => entry.userId === currentUser.id);

  // Mock data for charts
  const weeklyData = [
    { day: 'Mon', hours: 8.5 },
    { day: 'Tue', hours: 7.8 },
    { day: 'Wed', hours: 8.2 },
    { day: 'Thu', hours: 8.0 },
    { day: 'Fri', hours: 7.5 },
  ];

  const workBreakData = [
    { name: 'Work Time', value: 75, color: '#4A90E2' },
    { name: 'Break Time', value: 25, color: '#FF9800' },
  ];

  // Calculate today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = userEntries.find(entry => entry.date === today);
  const totalWeekHours = weeklyData.reduce((sum, day) => sum + day.hours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Welcome back, {currentUser.name.split(' ')[0]}!</h1>
          <p className="text-gray-600 mt-1">Track your time and view your productivity insights</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-2xl font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Today's Hours</p>
                <p className="text-xl font-semibold text-blue-900">{todayEntry?.totalHours || 0}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">This Week</p>
                <p className="text-xl font-semibold text-green-900">{totalWeekHours}h</p>
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
                <p className="text-sm text-orange-600">Break Time</p>
                <p className="text-xl font-semibold text-orange-900">{todayEntry?.breakHours || 0}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600">Days This Week</p>
                <p className="text-xl font-semibold text-purple-900">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clock Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Time Clock</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClockControls size="large" />
        </CardContent>
      </Card>

      {/* Charts and Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Hours Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="day" className="text-sm" />
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
                  dataKey="hours" 
                  stroke="#4A90E2" 
                  strokeWidth={3}
                  dot={{ fill: '#4A90E2', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Work vs Break Time */}
        <Card>
          <CardHeader>
            <CardTitle>Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={workBreakData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {workBreakData.map((entry, index) => (
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
            <div className="flex justify-center space-x-6 mt-4">
              {workBreakData.map((entry, index) => (
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

      {/* Recent Time Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Clock In</th>
                  <th className="text-left py-3 px-4">Clock Out</th>
                  <th className="text-left py-3 px-4">Break Duration</th>
                  <th className="text-left py-3 px-4">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {userEntries.slice(0, 7).map((entry, index) => (
                  <tr key={entry.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{entry.clockIn || '-'}</td>
                    <td className="py-3 px-4">{entry.clockOut || '-'}</td>
                    <td className="py-3 px-4">{entry.breakHours}h</td>
                    <td className="py-3 px-4 font-medium">{entry.totalHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}