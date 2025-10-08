import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UserPlus, Edit3, Trash2, Search, Filter } from 'lucide-react';
import { useAppContext, User, UserRole } from '../App';

export function UserManagement() {
  const { currentUser, users, setUsers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee' as UserRole,
    department: ''
  });

  // Filter users based on current user role
  const getAvailableUsers = () => {
    if (currentUser.role === 'manager') {
      return users.filter(user => user.role === 'employee');
    } else if (currentUser.role === 'general_manager') {
      return users.filter(user => user.id !== currentUser.id);
    }
    return [];
  };

  const availableUsers = getAvailableUsers();

  // Filter users based on search and role filter
  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      isOnline: false
    };

    setUsers([...users, newUser]);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    const updatedUsers = users.map(user =>
      user.id === editingUser.id
        ? { ...user, ...formData }
        : user
    );

    setUsers(updatedUsers);
    setIsDialogOpen(false);
    setEditingUser(null);
    resetForm();
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'employee',
      department: ''
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || ''
    });
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const getAvailableRoles = () => {
    if (currentUser.role === 'manager') {
      return [{ value: 'employee', label: 'Employee' }];
    } else if (currentUser.role === 'general_manager') {
      return [
        { value: 'employee', label: 'Employee' },
        { value: 'manager', label: 'Manager' }
      ];
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {currentUser.role === 'manager' ? 'Employee Management' : 'User Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {currentUser.role === 'manager' 
              ? 'Manage your team members and their information'
              : 'Manage all users, roles, and permissions across the organization'
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={openCreateDialog}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add {currentUser.role === 'manager' ? 'Employee' : 'User'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : `Add New ${currentUser.role === 'manager' ? 'Employee' : 'User'}`}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Update user information below.' : 'Fill in the details to create a new user account.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter department"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={editingUser ? handleUpdateUser : handleCreateUser}
                  disabled={!formData.name || !formData.email}
                >
                  {editingUser ? 'Update' : 'Create'} User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  {currentUser.role === 'general_manager' && (
                    <SelectItem value="manager">Manager</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-700">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Role</span>
                  <Badge 
                    variant="secondary"
                    className={
                      user.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'employee' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }
                  >
                    {user.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                
                {user.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Department</span>
                    <span className="text-sm font-medium text-gray-900">{user.department}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge 
                    variant={user.isOnline ? "default" : "secondary"}
                    className={user.isOnline ? "bg-green-100 text-green-700" : ""}
                  >
                    {user.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterRole !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first user.'
              }
            </p>
            {!searchTerm && filterRole === 'all' && (
              <Button onClick={openCreateDialog}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}