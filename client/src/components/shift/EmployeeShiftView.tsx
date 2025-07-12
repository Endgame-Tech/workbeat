import React, { useState, useEffect } from 'react';
import { shiftService } from '../../services/shiftService';
import api from '../../services/api';
import { ScheduledShift, Employee } from '../../types';

export const EmployeeShiftView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [employeeShifts, setEmployeeShifts] = useState<ScheduledShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    const loadEmployeeShifts = async () => {
      if (!selectedEmployee) return;

      try {
        setLoading(true);
        const response = await shiftService.getEmployeeSchedule(selectedEmployee, {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
        setEmployeeShifts(response || []);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load employee shifts');
      } finally {
        setLoading(false);
      }
    };

    if (selectedEmployee) {
      loadEmployeeShifts();
    }
  }, [selectedEmployee, dateRange]);

  const loadEmployees = async () => {
    try {
      const response = await api.get('/api/employees');
      setEmployees(response.data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    }
  };

  const handleShiftUpdate = async (shiftId: number, updates: { status?: string; notes?: string }) => {
    try {
      const updatedShift = await shiftService.updateScheduledShift(shiftId, updates);
      setEmployeeShifts(prev => prev.map(shift => 
        shift.id === shiftId ? updatedShift : shift
      ));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update shift');
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString([], { 
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Employee Shift View</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Employee Selection */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Select Employee</h3>
          <select
            value={selectedEmployee || ''}
            onChange={(e) => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose an employee</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>

          {selectedEmployeeData && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {selectedEmployeeData.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Department:</strong> {selectedEmployeeData.department || 'Not assigned'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Position:</strong> {selectedEmployeeData.position || 'Not assigned'}
              </p>
            </div>
          )}
        </div>

        {/* Date Range Selection */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Date Range</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => setDateRange({
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              })}
              className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              This Week
            </button>
            <button
              onClick={() => setDateRange({
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              })}
              className="w-full px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Next Week
            </button>
            <button
              onClick={() => setDateRange({
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              })}
              className="w-full px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              Next 30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Employee Shifts */}
      {selectedEmployee && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">
              Shifts for {selectedEmployeeData?.name}
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading shifts...</p>
            </div>
          ) : employeeShifts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No shifts scheduled for the selected period.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {employeeShifts.map((shift) => (
                <div key={shift.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(shift.date)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </p>
                        </div>
                        {shift.shiftTemplate && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              {shift.shiftTemplate.name}
                            </p>
                            {shift.shiftTemplate.breakDuration > 0 && (
                              <p className="text-xs text-gray-500">
                                Break: {shift.shiftTemplate.breakDuration} min
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {shift.notes && (
                        <p className="mt-2 text-sm text-gray-600">
                          <strong>Notes:</strong> {shift.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shift.status || 'scheduled')}`}>
                        {shift.status || 'Scheduled'}
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleShiftUpdate(shift.id, { status: 'completed' })}
                          className="text-green-600 hover:text-green-800 text-sm"
                          disabled={shift.status === 'completed'}
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleShiftUpdate(shift.id, { status: 'cancelled' })}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={shift.status === 'cancelled'}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
