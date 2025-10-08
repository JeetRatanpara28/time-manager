import React, { useState, createContext, useContext } from 'react';
import { Sidebar } from './components/Sidebar';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { GeneralManagerDashboard } from './components/GeneralManagerDashboard';
import { UserManagement } from './components/UserManagement';
import { Logs } from './components/Logs';
import { Settings } from './components/Settings';

export type UserRole = 'employee' | 'manager' | 'general_manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isOnline: boolean;
  department?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakIn?: string;
  breakOut?: string;
  totalHours: number;
  breakHours: number;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  timeEntries: TimeEntry[];
  setTimeEntries: (entries: TimeEntry[]) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// Mock data
const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@company.com', role: 'employee', isOnline: true, department: 'Engineering' },
  { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'employee', isOnline: false, department: 'Design' },
  { id: '3', name: 'Mike Johnson', email: 'mike@company.com', role: 'manager', isOnline: true, department: 'Engineering' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', role: 'general_manager', isOnline: true, department: 'Operations' },
];

const mockTimeEntries: TimeEntry[] = [
  { id: '1', userId: '1', date: '2024-10-03', clockIn: '09:00', clockOut: '17:30', breakIn: '12:00', breakOut: '13:00', totalHours: 7.5, breakHours: 1 },
  { id: '2', userId: '2', date: '2024-10-03', clockIn: '08:30', clockOut: '17:00', breakIn: '12:30', breakOut: '13:30', totalHours: 7.5, breakHours: 1 },
  { id: '3', userId: '3', date: '2024-10-03', clockIn: '09:15', clockOut: '18:00', breakIn: '12:15', breakOut: '13:00', totalHours: 8, breakHours: 0.75 },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]); // Default to employee
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (currentUser.role === 'employee') {
          return <EmployeeDashboard />;
        } else if (currentUser.role === 'manager') {
          return <ManagerDashboard />;
        } else {
          return <GeneralManagerDashboard />;
        }
      case 'users':
        return <UserManagement />;
      case 'logs':
        return <Logs />;
      case 'settings':
        return <Settings />;
      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      users,
      setUsers,
      timeEntries,
      setTimeEntries,
      activeTab,
      setActiveTab
    }}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Demo Role Switcher */}
        <div className="fixed top-4 right-4 z-50 bg-white p-3 rounded-lg shadow-lg border">
          <label className="block mb-2">Demo Role:</label>
          <select 
            value={currentUser.id} 
            onChange={(e) => {
              const user = users.find(u => u.id === e.target.value);
              if (user) {
                setCurrentUser(user);
                setActiveTab('dashboard');
              }
            }}
            className="border rounded px-2 py-1"
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          {renderMainContent()}
        </main>
      </div>
    </AppContext.Provider>
  );
}