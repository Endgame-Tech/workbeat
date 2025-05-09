import React, { useState, useEffect } from 'react';
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

  // Update the current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Check if employee is late (only for sign-in)
      if (selectedEmployee && attendanceType === 'sign-in') {
        setLateWarning(isEmployeeLate(now, selectedEmployee.workingHours));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [selectedEmployee, attendanceType]);

  // Check location permission
  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        const location = await attendanceService.getClientLocation();
        setLocationStatus(location ? 'granted' : 'denied');
      } catch (error) {
        setLocationStatus('denied');
      }
    };
    
    checkLocationPermission();
  }, []);

  // Update selected employee when ID changes
  useEffect(() => {
    if (selectedEmployeeId) {
      const employee = employees.find(emp => emp._id === selectedEmployeeId) || null;
      setSelectedEmployee(employee);
      
      // Check late status when selecting an employee for sign-in
      if (employee && attendanceType === 'sign-in') {
        setLateWarning(isEmployeeLate(new Date(), employee.workingHours));
      } else {
        setLateWarning(false);
      }
    } else {
      setSelectedEmployee(null);
      setLateWarning(false);
    }
  }, [selectedEmployeeId, employees, attendanceType]);

  // Prepare employee options for the dropdown
  const employeeOptions = employees
    .filter(emp => emp.isActive)
    .map(emp => ({
      value: emp._id,
      label: `${emp.name} (${emp.department})`
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get client IP address
      const ipAddress = await attendanceService.getClientIpAddress();
      
      // Get location (if permission is granted)
      const location = await attendanceService.getClientLocation();
      
      // Create attendance record using the service
      const record = await attendanceService.recordAttendance(
        selectedEmployeeId,
        selectedEmployee?.name || 'Unknown Employee',
        attendanceType,
        ipAddress,
        location,
        notes,
        qrValue
      );
      
      onSubmit(record);
    } catch (error) {
      console.error('Error creating attendance record:', error);
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
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Clock size={16} className="mr-1" />
            {formatTime(currentTime)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex justify-center space-x-4 mb-6">
              <Button
                type="button"
                variant={attendanceType === 'sign-in' ? 'primary' : 'ghost'}
                onClick={() => setAttendanceType('sign-in')}
                leftIcon={<UserCheck size={18} />}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={attendanceType === 'sign-out' ? 'primary' : 'ghost'}
                onClick={() => setAttendanceType('sign-out')}
                leftIcon={<CheckCircle size={18} />}
                className="flex-1"
              >
                Sign Out
              </Button>
            </div>
            
            <Select
              label="Select Employee"
              options={employeeOptions}
              value={selectedEmployeeId}
              onChange={setSelectedEmployeeId}
              required
            />
            
            {selectedEmployee && lateWarning && attendanceType === 'sign-in' && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start space-x-2">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Late Sign-In</p>
                  <p>You are signing in after your scheduled start time ({selectedEmployee.workingHours.start}).</p>
                </div>
              </div>
            )}
            
            <Textarea
              label="Notes (Optional)"
              placeholder="Any additional details for today..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            
            <div className="flex items-center mt-2">
              <MapPin size={16} className={`mr-2 ${locationStatus === 'granted' ? 'text-green-500' : 'text-amber-500'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {locationStatus === 'granted' 
                  ? 'Location access granted' 
                  : 'Location permission required for attendance'}
              </span>
            </div>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="ghost" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        <Button 
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!selectedEmployeeId || locationStatus !== 'granted'}
        >
          {attendanceType === 'sign-in' ? 'Sign In' : 'Sign Out'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttendanceForm;