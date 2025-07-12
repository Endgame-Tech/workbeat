import React, { useState } from 'react';
import { ShiftTemplatesList } from './ShiftTemplatesList';
import { ShiftSchedulingCalendar } from './ShiftSchedulingCalendar';
import { EmployeeShiftView } from './EmployeeShiftView';

type ShiftTab = 'templates' | 'schedule' | 'employee-view';

export const ShiftManagementDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ShiftTab>('schedule');

  const tabs = [
    { id: 'templates' as const, label: 'Shift Templates', icon: '📋' },
    { id: 'schedule' as const, label: 'Schedule Calendar', icon: '📅' },
    { id: 'employee-view' as const, label: 'Employee View', icon: '👥' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'templates':
        return <ShiftTemplatesList />;
      case 'schedule':
        return <ShiftSchedulingCalendar />;
      case 'employee-view':
        return <EmployeeShiftView />;
      default:
        return <ShiftSchedulingCalendar />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg">
        {renderContent()}
      </div>
    </div>
  );
};
