import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import EmployeeTable from './EmployeeTable';
import EmployeeForm from './EmployeeForm';
import { toast } from 'react-hot-toast';
import { employeeService } from '../../services/employeeService';

// Define a type for user data from localStorage
interface UserData {
  _id?: string;
  organizationId?: string;
  name?: string;
  email?: string;
  role?: string;
}

// Define a more specific error type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}


const AdminPortal: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      console.log('Fetching employees...');
      const data = await employeeService.getAllEmployees();
      console.log('Fetched employees:', data);
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    }
  };

  // Replace the handleAddEmployee function in AdminPortal.tsx
  const handleAddEmployee = async (employeeData: Partial<Employee>) => {
    console.log('AdminPortal received employeeData:', employeeData);
    setIsLoading(true);
    
    try {
      // Ensure organizationId is set
      const dataToSubmit = { ...employeeData };
      
      if (!dataToSubmit.organizationId) {
        const userString = localStorage.getItem('user');
        if (userString) {
          try {
            const userData: UserData = JSON.parse(userString);
            if (userData.organizationId) {
              dataToSubmit.organizationId = userData.organizationId;
              console.log('Added organizationId to employeeData:', userData.organizationId);
            } else {
              toast.error('Organization ID is missing from your user profile');
              console.error('No organizationId found in user data');
              setIsLoading(false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing user data from localStorage:', parseError);
            toast.error('Error reading user data. Please try logging in again.');
            setIsLoading(false);
            return;
          }
        } else {
          toast.error('User session not found. Please log in again.');
          console.error('No user data found in localStorage');
          setIsLoading(false);
          return;
        }
      }
      
      // Make sure working hours are set properly
      if (dataToSubmit.workSchedule && dataToSubmit.workSchedule.hours) {
        dataToSubmit.workingHours = {
          start: dataToSubmit.workSchedule.hours.start,
          end: dataToSubmit.workSchedule.hours.end
        };
      }
      
      console.log('Final employee data being sent to API:', dataToSubmit);
      
      // Create the employee
      const response = await employeeService.createEmployee(dataToSubmit);
      console.log('API response from create employee:', response);
      
      // Success handling
      toast.success(`Employee ${dataToSubmit.name} added successfully`);
      
      // Refresh employee list and reset UI
      await fetchEmployees();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error adding employee:', error);
      
      // Type assertion for specific error handling
      const apiError = error as ApiError;
      
      // Provide more detailed error message if possible
      if (apiError.response?.data?.message) {
        toast.error(`Failed to add employee: ${apiError.response.data.message}`);
      } else {
        toast.error('Failed to add employee. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmployee = async (employeeData: Partial<Employee>) => {
    if (!selectedEmployee || !selectedEmployee._id) return;

    setIsLoading(true);
    try {
      console.log('Updating employee:', selectedEmployee._id, 'with data:', employeeData);
      
      // Make sure working hours are set properly
      if (employeeData.workSchedule && employeeData.workSchedule.hours) {
        employeeData.workingHours = {
          start: employeeData.workSchedule.hours.start,
          end: employeeData.workSchedule.hours.end
        };
      }
      
      const updatedEmployee = await employeeService.updateEmployee(selectedEmployee._id, employeeData);
      console.log('Updated employee response:', updatedEmployee);

      // Update local state
      setEmployees(employees.map(emp => 
        emp._id === selectedEmployee._id ? updatedEmployee : emp
      ));
      
      setSelectedEmployee(null);
      setIsFormOpen(false);
      toast.success('Employee updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      
      // Type assertion for specific error handling
      const apiError = error as ApiError;
      
      // Provide more detailed error message if possible
      if (apiError.response?.data?.message) {
        toast.error(`Failed to update employee: ${apiError.response.data.message}`);
      } else {
        toast.error('Failed to update employee. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!employee._id) return;
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      console.log('Deleting employee:', employee._id);
      const success = await employeeService.deleteEmployee(employee._id);
      
      if (!success) {
        throw new Error('Delete operation failed');
      }

      setEmployees(employees.filter(emp => emp._id !== employee._id));
      toast.success('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const handleToggleStatus = async (employee: Employee) => {
    if (!employee._id) return;

    try {
      const newStatus = !employee.isActive;
      const updatedEmployee = await employeeService.toggleEmployeeStatus(employee._id, newStatus);
      
      // Update local state
      setEmployees(employees.map(emp => 
        emp._id === employee._id ? updatedEmployee : emp
      ));
      
      toast.success(`Employee ${employee.name} ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling employee status:', error);
      toast.error('Failed to update employee status');
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setSelectedEmployee(null);
    setIsFormOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {isFormOpen ? (
        <EmployeeForm
          employee={selectedEmployee || undefined}
          onSubmit={selectedEmployee ? handleUpdateEmployee : handleAddEmployee}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      ) : (
        <EmployeeTable
          employees={employees}
          onEdit={handleEdit}
          onDelete={handleDeleteEmployee}
          onAdd={handleAdd}
          onRefresh={fetchEmployees}
          isLoading={isLoading}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
};

export default AdminPortal;