import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  isEmployeeLate,
  formatTime 
} from '../utils/attendanceUtils';
import { Employee, AttendanceRecord } from '../types';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import { CheckCircle, Clock, MapPin, UserCheck, AlertCircle } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import offlineAttendanceService from '../services/offlineAttendanceService';
import { useOffline } from './context/OfflineContext';

interface AttendanceFormProps {
  qrValue: string;
  onSubmit: (record: AttendanceRecord) => void;
  onCancel: () => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  qrValue,
  onSubmit,
  onCancel
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [notes, setNotes] = useState('');
  const [attendanceType, setAttendanceType] = useState<'sign-in' | 'sign-out'>('sign-in');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [lateWarning, setLateWarning] = useState<boolean>(false);

  const { isOnline, offlineMode } = useOffline();

  // Fetch employees from API
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const activeEmployees = await employeeService.getAllEmployees(true);
        setEmployees(activeEmployees);
      } catch (err) {
        console.error('Error in fetch operation:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Request location permission
  useEffect(() => {
    const requestLocation = async () => {
      if ('geolocation' in navigator) {
        try {
          await navigator.geolocation.getCurrentPosition(
            () => setLocationStatus('granted'),
            () => setLocationStatus('denied')
          );
        } catch {
          setLocationStatus('denied');
        }
      } else {
        setLocationStatus('denied');
      }
    };

    requestLocation();
  }, []);

  // Check if employee is late when selection changes
  useEffect(() => {
    if (selectedEmployeeId && attendanceType === 'sign-in') {
      const employee = employees.find(emp => emp._id === selectedEmployeeId);
      if (employee) {
        setSelectedEmployee(employee);
        const isLate = isEmployeeLate(employee, new Date());
        setLateWarning(isLate);
      }
    } else {
      setLateWarning(false);
    }
  }, [selectedEmployeeId, employees, attendanceType]);

  // Prepare employee options for the dropdown
  const employeeOptions = employees
    .filter(emp => emp.isActive)
    .map(emp => ({
      value: emp._id || '',
      label: `${emp.name} (${emp.department})`
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId) {
      toast.error('Please select an employee.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get IP address and location
      let ipAddress = null;
      let location = null;
      
      try {
        // Get client IP from API if online
        if (isOnline && !offlineMode) {
          // Note: We'll need to add this method to attendanceService
          ipAddress = 'online'; // Placeholder - implement IP detection
        } else {
          ipAddress = 'offline'; // Placeholder for offline mode
        }
        
        // Get location if permission was granted
        if (locationStatus === 'granted') {
          location = await attendanceService.getClientLocation();
        }
      } catch (error) {
        console.warn('Failed to get IP or location:', error);
        // Continue without IP/location
      }
      
      // Use offline service that will handle both online and offline scenarios
      const record = await offlineAttendanceService.recordAttendance(
        selectedEmployeeId,
        selectedEmployee?.name || 'Unknown Employee',
        attendanceType,
        ipAddress,
        location,
        notes,
        qrValue
      );
      
      // Check if the record has an offline flag
      const isOfflineRecord = (record as any).offline;
      
      // Show appropriate toast message
      if (isOfflineRecord) {
        toast.success(`${attendanceType === 'sign-in' ? 'Signed in' : 'Signed out'} in offline mode. Will sync when online.`);
      } else {
        toast.success(`Successfully ${attendanceType === 'sign-in' ? 'signed in' : 'signed out'}!`);
      }
      
      onSubmit(record);
    } catch (error) {
      console.error('Error creating attendance record:', error);
      toast.error('Failed to record attendance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">Loading employees...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {attendanceType === 'sign-in' ? 'Sign In' : 'Sign Out'}
          </h2>
          {!isOnline && (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <AlertCircle size={16} />
              <span className="text-sm">Offline Mode</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock size={16} />
          <span>{formatTime(currentTime)}</span>
          <MapPin size={16} />
          <span className={locationStatus === 'granted' ? 'text-green-600' : 'text-red-600'}>
            {locationStatus === 'granted' ? 'Location Available' : 'Location Unavailable'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Attendance Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={attendanceType === 'sign-in' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setAttendanceType('sign-in')}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={attendanceType === 'sign-out' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setAttendanceType('sign-out')}
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>

            {/* Employee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Employee
              </label>
              <Select
                value={selectedEmployeeId}
                onChange={(value) => setSelectedEmployeeId(value)}
                options={employeeOptions}
                required
              />
            </div>

            {/* Late Warning */}
            {lateWarning && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <AlertCircle className="text-amber-600" size={16} />
                <span className="text-sm text-amber-800 dark:text-amber-200">
                  This employee appears to be late for their shift.
                </span>
              </div>
            )}

            {/* Selected Employee Info */}
            {selectedEmployee && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="text-blue-600" size={16} />
                  <span className="font-medium text-blue-800 dark:text-blue-200">
                    {selectedEmployee.name}
                  </span>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <div>Department: {selectedEmployee.department}</div>
                  <div>Position: {selectedEmployee.position}</div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!selectedEmployeeId || isSubmitting}
          loading={isSubmitting}
          leftIcon={<CheckCircle size={16} />}
          className="flex-1"
        >
          {isSubmitting 
            ? 'Recording...' 
            : `${attendanceType === 'sign-in' ? 'Sign In' : 'Sign Out'}`
          }
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttendanceForm;
