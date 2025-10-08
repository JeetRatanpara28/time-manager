import React, { useState } from 'react';
import { Clock, Coffee, LogOut, LogIn } from 'lucide-react';
import { useAppContext } from '../App';

interface ClockControlsProps {
  size?: 'large' | 'medium';
}

export function ClockControls({ size = 'large' }: ClockControlsProps) {
  const { currentUser, timeEntries, setTimeEntries } = useAppContext();
  const [currentStatus, setCurrentStatus] = useState<'out' | 'in' | 'break'>('out');

  const buttonSize = size === 'large' ? 'w-24 h-24' : 'w-16 h-16';
  const iconSize = size === 'large' ? 'w-8 h-8' : 'w-6 h-6';

  const handleClockAction = (action: 'clock_in' | 'clock_out' | 'break_in' | 'break_out') => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const dateString = now.toISOString().split('T')[0];

    // Find or create today's entry
    let todayEntry = timeEntries.find(entry => 
      entry.userId === currentUser.id && entry.date === dateString
    );

    if (!todayEntry) {
      todayEntry = {
        id: `${currentUser.id}-${dateString}`,
        userId: currentUser.id,
        date: dateString,
        totalHours: 0,
        breakHours: 0
      };
    }

    const updatedEntry = { ...todayEntry };

    switch (action) {
      case 'clock_in':
        updatedEntry.clockIn = timeString;
        setCurrentStatus('in');
        break;
      case 'clock_out':
        updatedEntry.clockOut = timeString;
        setCurrentStatus('out');
        // Calculate total hours
        if (updatedEntry.clockIn && updatedEntry.clockOut) {
          const clockInTime = new Date(`${dateString}T${updatedEntry.clockIn}`);
          const clockOutTime = new Date(`${dateString}T${updatedEntry.clockOut}`);
          const diffMs = clockOutTime.getTime() - clockInTime.getTime();
          updatedEntry.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        }
        break;
      case 'break_in':
        updatedEntry.breakIn = timeString;
        setCurrentStatus('break');
        break;
      case 'break_out':
        updatedEntry.breakOut = timeString;
        setCurrentStatus('in');
        // Calculate break hours
        if (updatedEntry.breakIn && updatedEntry.breakOut) {
          const breakInTime = new Date(`${dateString}T${updatedEntry.breakIn}`);
          const breakOutTime = new Date(`${dateString}T${updatedEntry.breakOut}`);
          const diffMs = breakOutTime.getTime() - breakInTime.getTime();
          updatedEntry.breakHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        }
        break;
    }

    // Update time entries
    const existingIndex = timeEntries.findIndex(entry => 
      entry.userId === currentUser.id && entry.date === dateString
    );

    if (existingIndex >= 0) {
      const newEntries = [...timeEntries];
      newEntries[existingIndex] = updatedEntry;
      setTimeEntries(newEntries);
    } else {
      setTimeEntries([...timeEntries, updatedEntry]);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {/* Clock In */}
      <button
        onClick={() => handleClockAction('clock_in')}
        disabled={currentStatus === 'in' || currentStatus === 'break'}
        className={`${buttonSize} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group`}
      >
        <LogIn className={`${iconSize} group-hover:scale-110 transition-transform`} />
      </button>

      {/* Clock Out */}
      <button
        onClick={() => handleClockAction('clock_out')}
        disabled={currentStatus === 'out'}
        className={`${buttonSize} rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group`}
      >
        <LogOut className={`${iconSize} group-hover:scale-110 transition-transform`} />
      </button>

      {/* Break In */}
      <button
        onClick={() => handleClockAction('break_in')}
        disabled={currentStatus !== 'in'}
        className={`${buttonSize} rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group`}
      >
        <Coffee className={`${iconSize} group-hover:scale-110 transition-transform`} />
      </button>

      {/* Break Out */}
      <button
        onClick={() => handleClockAction('break_out')}
        disabled={currentStatus !== 'break'}
        className={`${buttonSize} rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group`}
      >
        <Clock className={`${iconSize} group-hover:scale-110 transition-transform`} />
      </button>

      {/* Status Labels */}
      <div className="w-full flex justify-center mt-4">
        <div className="flex space-x-8 text-sm">
          <div className="text-center">
            <div className="text-blue-600 font-medium">Clock In</div>
          </div>
          <div className="text-center">
            <div className="text-red-600 font-medium">Clock Out</div>
          </div>
          <div className="text-center">
            <div className="text-orange-600 font-medium">Break In</div>
          </div>
          <div className="text-center">
            <div className="text-green-600 font-medium">Break Out</div>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="w-full flex justify-center mt-4">
        <div className={`px-4 py-2 rounded-full font-medium ${
          currentStatus === 'in' ? 'bg-green-100 text-green-700' :
          currentStatus === 'break' ? 'bg-orange-100 text-orange-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          Status: {currentStatus === 'in' ? 'Working' : currentStatus === 'break' ? 'On Break' : 'Clocked Out'}
        </div>
      </div>
    </div>
  );
}