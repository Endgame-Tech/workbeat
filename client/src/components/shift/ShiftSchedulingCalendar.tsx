import React, { useState, useEffect } from 'react';
import { shiftService } from '../../services/shiftService';
import api from '../../services/api';
import { ScheduledShift, ShiftTemplate, Employee } from '../../types';

interface ShiftSchedulingCalendarProps {
  onShiftScheduled?: (shift: ScheduledShift) => void;
}

export const ShiftSchedulingCalendar: React.FC<ShiftSchedulingCalendarProps> = ({
  onShiftScheduled
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const [shiftsResponse, templatesData, employeesData] = await Promise.all([
          shiftService.getScheduledShifts({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }),
          shiftService.getShiftTemplates(),
          api.get('/api/employees')
        ]);

        setScheduledShifts(Array.isArray(shiftsResponse.data) ? shiftsResponse.data : []);
        setShiftTemplates(Array.isArray(templatesData) ? templatesData : []);
        setEmployees(Array.isArray(employeesData.data) ? employeesData.data : []);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Reset to empty arrays on error to prevent filter issues
        setScheduledShifts([]);
        setShiftTemplates([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getShiftsForDate = (date: Date) => {
    return scheduledShifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.toDateString() === date.toDateString();
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowScheduleModal(true);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Shift Schedule</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            ←
          </button>
          <h3 className="text-lg font-medium">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            →
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading schedule...</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-gray-50">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7 gap-0">
            {getDaysInMonth(currentDate).map((date, index) => (
              <div
                key={index}
                className={`min-h-24 border-b border-r border-gray-200 p-1 ${
                  date ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${
                  date && date.toDateString() === new Date().toDateString() 
                    ? 'bg-blue-50' 
                    : ''
                }`}
                onClick={() => date && handleDateClick(date)}
              >
                {date && (
                  <>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {getShiftsForDate(date).slice(0, 2).map((shift) => (
                        <div
                          key={shift.id}
                          className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                          title={`${shift.employee?.name} - ${shift.shiftTemplate?.name}`}
                        >
                          {shift.employee?.name?.split(' ')[0]} - {shift.shiftTemplate?.name}
                        </div>
                      ))}
                      {getShiftsForDate(date).length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{getShiftsForDate(date).length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Shift Modal */}
      {showScheduleModal && selectedDate && !loading && (
        <ScheduleShiftModal
          date={selectedDate}
          employees={Array.isArray(employees) ? employees : []}
          shiftTemplates={Array.isArray(shiftTemplates) ? shiftTemplates : []}
          existingShifts={getShiftsForDate(selectedDate)}
          onSave={(shift) => {
            setScheduledShifts(prev => [...prev, shift]);
            setShowScheduleModal(false);
            if (onShiftScheduled) {
              onShiftScheduled(shift);
            }
          }}
          onCancel={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
};

interface ScheduleShiftModalProps {
  date: Date;
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  existingShifts: ScheduledShift[];
  onSave: (shift: ScheduledShift) => void;
  onCancel: () => void;
}

const ScheduleShiftModal: React.FC<ScheduleShiftModalProps> = ({
  date,
  employees,
  shiftTemplates,
  existingShifts,
  onSave,
  onCancel
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let shiftData;
      
      if (useTemplate && selectedTemplate) {
        const template = shiftTemplates.find(t => t.id === parseInt(selectedTemplate));
        if (!template) {
          throw new Error('Selected template not found');
        }
        
        shiftData = {
          employeeId: parseInt(selectedEmployee),
          shiftTemplateId: parseInt(selectedTemplate),
          date: date.toISOString().split('T')[0],
          startTime: template.startTime,
          endTime: template.endTime
        };
      } else {
        shiftData = {
          employeeId: parseInt(selectedEmployee),
          date: date.toISOString().split('T')[0],
          startTime: customStartTime,
          endTime: customEndTime
        };
      }

      const savedShift = await shiftService.createScheduledShift(shiftData);
      onSave(savedShift);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to schedule shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableEmployees = () => {
    // Ensure employees is an array
    if (!Array.isArray(employees)) {
      console.warn('Employees is not an array:', employees);
      return [];
    }
    
    // Ensure existingShifts is an array
    if (!Array.isArray(existingShifts)) {
      console.warn('ExistingShifts is not an array:', existingShifts);
      return employees;
    }
    
    const scheduledEmployeeIds = existingShifts.map(shift => shift.employeeId);
    return employees.filter(emp => !scheduledEmployeeIds.includes(emp.id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          Schedule Shift for {date.toLocaleDateString()}
        </h3>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee *
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an employee</option>
              {getAvailableEmployees().map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={useTemplate}
                onChange={() => setUseTemplate(true)}
                className="text-blue-600"
              />
              <span className="text-sm">Use Shift Template</span>
            </label>
            <label className="flex items-center space-x-2 mt-2">
              <input
                type="radio"
                checked={!useTemplate}
                onChange={() => setUseTemplate(false)}
                className="text-blue-600"
              />
              <span className="text-sm">Custom Times</span>
            </label>
          </div>

          {useTemplate ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Template *
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={useTemplate}
              >
                <option value="">Select a template</option>
                {shiftTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.startTime} - {template.endTime})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!useTemplate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!useTemplate}
                />
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Shift'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
