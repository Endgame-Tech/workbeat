import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from './ui/Card';
import Button from './ui/Button';
import { Employee } from '../types';
import { employeeService } from '../services/employeeService';
import { UserCheck, Search, FileText } from 'lucide-react';
import Input from './ui/Input';
import { toast } from 'react-hot-toast';

interface EmployeeSelectorProps {
  onEmployeeSelect: (employee: Employee, notes: string) => Promise<void>; // Updated to return Promise
  onCancel: () => void;
  attendanceType: 'sign-in' | 'sign-out';
  capturedFaceImage: string;
  organizationId?: string;
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  onEmployeeSelect,
  onCancel,
  attendanceType,
  capturedFaceImage,
  organizationId: propOrgId
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(propOrgId || null);
  const [notes, setNotes] = useState<string>('');
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false); // New state for selection in progress
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null); // New state for active employee

  // Get organization ID if not provided as a prop
  useEffect(() => {
    if (!organizationId) {
      const orgId = employeeService.getCurrentOrganizationId();
      setOrganizationId(orgId);
    }
  }, [organizationId]);

  // Fetch employees when component mounts
  useEffect(() => {
    if (organizationId) {
      fetchEmployees();
    }
  }, [organizationId]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const activeEmployees = await employeeService.getAllEmployees(true);
      
      console.log(`Fetched ${activeEmployees.length} active employees for organization ${organizationId}`);
      setEmployees(activeEmployees);
      setFilteredEmployees(activeEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employee list');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter employees when search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredEmployees(employees);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = employees.filter(employee => 
      employee.name?.toLowerCase().includes(lowerCaseQuery) ||
      employee.employeeId?.toLowerCase().includes(lowerCaseQuery) ||
      employee.department?.toLowerCase().includes(lowerCaseQuery)
    );
    
    setFilteredEmployees(filtered);
  }, [searchQuery, employees]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleEmployeeSelect = async (employee: Employee) => {
    if (isSelecting) return; // Prevent multiple clicks while processing

    setIsSelecting(true);
    setSelectedEmployeeId(employee._id || employee.id || employee.employeeId);
    
    console.log("Selected employee in selector:", employee);
    console.log("Employee ID formats:", {
      id: employee.id,
      _id: employee._id,
      employeeId: employee.employeeId
    });

    try {
      await onEmployeeSelect(employee, notes);
      toast.success(`Successfully ${attendanceType === 'sign-in' ? 'signed in' : 'signed out'} ${employee.name}`);
    } catch (error) {
      console.error('Error during employee selection:', error);
      toast.error(`Failed to ${attendanceType === 'sign-in' ? 'sign in' : 'sign out'} ${employee.name}`);
    } finally {
      setIsSelecting(false);
      setSelectedEmployeeId(null); // Reset active state after completion
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold text-center">
          Select Employee to {attendanceType === 'sign-in' ? 'Sign In' : 'Sign Out'}
        </h2>
        <div className="mt-2">
          <Input
            placeholder="Search by name, ID, or department..."
            value={searchQuery}
            onChange={handleSearch}
            leftIcon={<Search size={18} />}
            disabled={isSelecting} // Disable search during selection
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 max-h-96 overflow-y-auto">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No employees found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEmployees.map((employee) => (
              <div
                key={employee._id}
                className={`p-3 border border-gray-200 dark:border-gray-700 rounded-lg 
                           ${isSelecting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                           ${selectedEmployeeId === (employee._id || employee.id || employee.employeeId) 
                             ? 'bg-blue-100 dark:bg-blue-900 border-blue-400' 
                             : hoveredEmployeeId === (employee._id || employee.id || employee.employeeId) && !isSelecting 
                             ? 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-400 scale-102 shadow-md' 
                             : ''} 
                           transition-all duration-200 transform`}
                onClick={() => !isSelecting && handleEmployeeSelect(employee)}
                onMouseEnter={() => !isSelecting && setHoveredEmployeeId(employee._id || employee.id || employee.employeeId)}
                onMouseLeave={() => !isSelecting && setHoveredEmployeeId(null)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-300 font-semibold">
                      {employee.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">{employee.name}</h3>
                    <div className="flex text-xs text-gray-500 dark:text-gray-400">
                      <span>{employee.department}</span>
                      <span className="mx-1">•</span>
                      <span>{employee.position}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <div className="px-4 pb-3">
        <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <FileText size={16} className="mr-2" />
          Attendance Notes
        </div>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Add any additional notes about this attendance..."
          className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          rows={3}
          disabled={isSelecting} // Disable notes during selection
        />
      </div>

      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onCancel} disabled={isSelecting}>
          Cancel
        </Button>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
          <UserCheck size={14} className="mr-1" />
          {filteredEmployees.length} employee(s)
        </div>
      </CardFooter>
    </Card>
  );
};

export default EmployeeSelector;