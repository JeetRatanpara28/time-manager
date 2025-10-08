import React from 'react';
import { Clock, Users, FileText, Settings, BarChart3 } from 'lucide-react';
import { useAppContext } from '../App';

export function Sidebar() {
  const { currentUser, activeTab, setActiveTab } = useAppContext();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 }
    ];

    if (currentUser.role === 'manager') {
      baseItems.push({ id: 'users', label: 'Employees', icon: Users });
    } else if (currentUser.role === 'general_manager') {
      baseItems.push(
        { id: 'users', label: 'Users', icon: Users },
        { id: 'logs', label: 'Logs', icon: FileText }
      );
    }

    baseItems.push({ id: 'settings', label: 'Settings', icon: Settings });
    
    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">TimeManager</h1>
            <p className="text-sm text-gray-500">Professional Time Tracking</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{currentUser.name}</p>
            <p className="text-sm text-gray-500 capitalize">
              {currentUser.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Status Indicator */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Online</span>
          </div>
          <p className="text-xs text-green-600 mt-1">Connected to server</p>
        </div>
      </div>
    </div>
  );
}