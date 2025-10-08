import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Download, Search, Filter, Calendar as CalendarIcon, Eye } from 'lucide-react';
import { useAppContext } from '../App';
import { format } from 'date-fns';

export function Logs() {
  const { currentUser, users, timeEntries } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  // Filter entries based on user role
  const getAvailableEntries = () => {
    if (currentUser.role === 'general_manager') {
      return timeEntries;
    }
    return [];
  };

  const availableEntries = getAvailableEntries();

  // Filter entries based on search criteria
  const filteredEntries = availableEntries.filter(entry => {
    const user = users.find(u => u.id === entry.userId);
    if (!user) return false;

    const matchesUser = selectedUser === 'all' || entry.userId === selectedUser;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const entryDate = new Date(entry.date);
    const matchesDateRange = !dateRange.from || !dateRange.to ||
                            (entryDate >= dateRange.from && entryDate <= dateRange.to);

    return matchesUser && matchesSearch && matchesDateRange;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + entriesPerPage);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Employee,Role,Department,Date,Clock In,Clock Out,Break In,Break Out,Break Hours,Total Hours\n"
      + filteredEntries.map(entry => {
          const user = users.find(u => u.id === entry.userId);
          return `${user?.name || 'Unknown'},${user?.role || ''},${user?.department || ''},${entry.date},${entry.clockIn || ''},${entry.clockOut || ''},${entry.breakIn || ''},${entry.breakOut || ''},${entry.breakHours},${entry.totalHours}`;
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `time_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateStats = () => {
    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const totalBreakHours = filteredEntries.reduce((sum, entry) => sum + entry.breakHours, 0);
    const uniqueUsers = new Set(filteredEntries.map(entry => entry.userId)).size;
    const avgHoursPerDay = totalHours / filteredEntries.length || 0;

    return { totalHours, totalBreakHours, uniqueUsers, avgHoursPerDay };
  };

  const stats = calculateStats();

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getUserRole = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.role : 'unknown';
  };

  const getUserDepartment = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.department : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600 mt-1">Comprehensive view of all time tracking activities across the organization</p>
        </div>
        <Button onClick={handleExportCSV} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-blue-600">Total Hours</p>
              <p className="text-2xl font-semibold text-blue-900">{stats.totalHours.toFixed(1)}h</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-orange-600">Break Hours</p>
              <p className="text-2xl font-semibold text-orange-900">{stats.totalBreakHours.toFixed(1)}h</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-green-600">Unique Users</p>
              <p className="text-2xl font-semibold text-green-900">{stats.uniqueUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-purple-600">Avg Hours/Day</p>
              <p className="text-2xl font-semibold text-purple-900">{stats.avgHoursPerDay.toFixed(1)}h</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by user name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User Filter */}
            <div className="lg:w-48">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role.replace('_', ' ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="lg:w-48">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Logs ({filteredEntries.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Employee</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Clock In</th>
                  <th className="text-left py-3 px-4">Clock Out</th>
                  <th className="text-left py-3 px-4">Break Time</th>
                  <th className="text-left py-3 px-4">Total Hours</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry, index) => (
                  <tr key={entry.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700">
                            {getUserName(entry.userId).split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{getUserName(entry.userId)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant="secondary"
                        className={
                          getUserRole(entry.userId) === 'manager' ? 'bg-purple-100 text-purple-700' :
                          getUserRole(entry.userId) === 'employee' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {getUserRole(entry.userId).replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{getUserDepartment(entry.userId)}</td>
                    <td className="py-3 px-4">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{entry.clockIn || '-'}</td>
                    <td className="py-3 px-4">{entry.clockOut || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="text-orange-600 font-medium">{entry.breakHours}h</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900">{entry.totalHours}h</span>
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredEntries.length)} of {filteredEntries.length} entries
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedUser !== 'all' || dateRange.from 
                ? 'Try adjusting your search criteria or date range.'
                : 'Time logs will appear here as users clock in and out.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}