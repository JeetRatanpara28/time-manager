import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { User, Settings as SettingsIcon, Bell, Shield, Clock, Save, Camera } from 'lucide-react';
import { useAppContext } from '../App';

export function Settings() {
  const { currentUser, setCurrentUser, users, setUsers } = useAppContext();
  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    department: currentUser.department || '',
    phone: '',
    address: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    clockReminders: true,
    weeklyReports: false,
    systemUpdates: true
  });
  const [timeSettings, setTimeSettings] = useState({
    workingHours: 8,
    breakDuration: 1,
    overtimeAlert: true,
    autoClockOut: false
  });

  const handleProfileUpdate = () => {
    const updatedUser = { ...currentUser, ...profileData };
    setCurrentUser(updatedUser);
    
    // Update in users array
    const updatedUsers = users.map(user => 
      user.id === currentUser.id ? updatedUser : user
    );
    setUsers(updatedUsers);
    
    alert('Profile updated successfully!');
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    
    // In a real app, this would validate current password and update
    alert('Password changed successfully!');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleNotificationSave = () => {
    alert('Notification preferences saved!');
  };

  const handleTimeSettingsSave = () => {
    alert('Time settings saved!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-medium text-gray-700">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <Button variant="outline" className="mb-2">
                <Camera className="w-4 h-4 mr-2" />
                Change Photo
              </Button>
              <p className="text-sm text-gray-500">JPG, GIF or PNG. 1MB max.</p>
            </div>
          </div>

          <Separator />

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={profileData.address}
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          {/* Role Badge */}
          <div>
            <Label>Current Role</Label>
            <div className="mt-2">
              <Badge 
                variant="secondary"
                className={
                  currentUser.role === 'general_manager' ? 'bg-purple-100 text-purple-700' :
                  currentUser.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }
              >
                {currentUser.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleProfileUpdate}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Password & Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handlePasswordChange}
              disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Clock-in Reminders</Label>
                <p className="text-sm text-gray-500">Get reminded to clock in/out</p>
              </div>
              <Switch
                checked={notifications.clockReminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, clockReminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Weekly Reports</Label>
                <p className="text-sm text-gray-500">Receive weekly time summaries</p>
              </div>
              <Switch
                checked={notifications.weeklyReports}
                onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>System Updates</Label>
                <p className="text-sm text-gray-500">Get notified about system changes</p>
              </div>
              <Switch
                checked={notifications.systemUpdates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, systemUpdates: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleNotificationSave}>
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Time Tracking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Time Tracking Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workingHours">Standard Working Hours</Label>
              <Input
                id="workingHours"
                type="number"
                min="1"
                max="12"
                value={timeSettings.workingHours}
                onChange={(e) => setTimeSettings({ ...timeSettings, workingHours: parseInt(e.target.value) || 8 })}
              />
            </div>
            <div>
              <Label htmlFor="breakDuration">Default Break Duration (hours)</Label>
              <Input
                id="breakDuration"
                type="number"
                min="0.5"
                max="3"
                step="0.5"
                value={timeSettings.breakDuration}
                onChange={(e) => setTimeSettings({ ...timeSettings, breakDuration: parseFloat(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Overtime Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when working overtime</p>
              </div>
              <Switch
                checked={timeSettings.overtimeAlert}
                onCheckedChange={(checked) => setTimeSettings({ ...timeSettings, overtimeAlert: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Clock-out</Label>
                <p className="text-sm text-gray-500">Automatically clock out after standard hours</p>
              </div>
              <Switch
                checked={timeSettings.autoClockOut}
                onCheckedChange={(checked) => setTimeSettings({ ...timeSettings, autoClockOut: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleTimeSettingsSave}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Account Created</p>
              <p className="font-medium">January 15, 2024</p>
            </div>
            <div>
              <p className="text-gray-500">Last Login</p>
              <p className="font-medium">Today at 9:00 AM</p>
            </div>
            <div>
              <p className="text-gray-500">User ID</p>
              <p className="font-medium">{currentUser.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Account Status</p>
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}