import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import EmployeeForm from '../admin/EmployeeForm';
import EmployeeTable from '../admin/EmployeeTable';
import { PlusCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Employee } from '../../types';
import { employeeService } from '../../services/employeeService';
import { toast } from 'react-hot-toast';
import { useSubscription } from '../../hooks/useSubscription';
import { EmployeeLimitGate, FeatureButton } from '../subscription/FeatureGate';
import SubscriptionStatus from '../subscription/SubscriptionStatus';

const OrganizationEmployees: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [organizationName, setOrganizationName] = useState<string>('Your Organization');
  const { hasFeature, canAddEmployees, getMaxEmployees } = useSubscription();

  // Extract organization name on mount
  useEffect(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        if (userData.organizationName) {
          setOrganizationName(userData.organizationName);
        }
      }
    } catch (error) {
      console.error('Error getting organization name:', error);
    }
  }, []);

  // Define fetchEmployees as a useCallback
  const fetchEmployees = useCallback(async () => {
    if (!organizationId) {
      console.warn('Cannot fetch employees: Missing organization ID');
      return [];
    }
    
    setLoadingEmployees(true);
    try {
      console.log('Fetching employees for organization:', organizationId);
      const data = await employeeService.getAllEmployees();
      console.log('Fetched employees:', data);
      
      // Important: Make sure you're setting state with the new data
      setEmployees(data || []);
      
      // Double check that data was received
      if (!data || data.length === 0) {
        console.warn('No employees returned from API');
      }
      
      return data || [];
    } catch (err) {
      console.error('Error in fetch operation:', err);
      // Don't show toast for data loading errors - let the UI handle empty states gracefully
      // Only log the error for debugging
      setEmployees([]);
      return [];
    } finally {
      setLoadingEmployees(false);
    }
  }, [organizationId]);

  // Fetch employees on mount and when organizationId changes
  useEffect(() => {
    if (organizationId) {
      console.log("Organization ID is available, fetching data:", organizationId);
      fetchEmployees();
    } else {
      console.warn("No organization ID available yet, data fetch delayed");
    }
  }, [organizationId, fetchEmployees]);

  // Handle employee editing
  function handleEditEmployee(employee: Employee) {
    console.log("Employee to edit:", employee);
    console.log("Employee ID value:", employee.id || employee._id);
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  }

  // Handle employee form submission
  const handleEmployeeSubmit = async (data: Partial<Employee>) => {
    console.log('Form data received:', data);
    setIsSubmitting(true);

    try {
      // Format dates properly if they exist
      if (data.startDate && typeof data.startDate === 'string' && !data.startDate.includes('T')) {
        data.startDate = new Date(data.startDate).toISOString();
      }
      
      // Ensure the organization ID is set
      const employeeData = {
        ...data,
        organizationId: organizationId || undefined
      };
      
      if (!employeeData.organizationId) {
        throw new Error('Organization ID is required');
      }
      
      if (editingEmployee) {
        // Get the ID, handling both potential formats (_id or id)
        const employeeId = editingEmployee._id || editingEmployee.id;
        console.log('Updating employee with ID:', employeeId);
        
        // Update existing employee
        await employeeService.updateEmployee(String(employeeId), employeeData);
        toast.success(`Employee ${data.name} updated successfully`);
      } else {
        // Create new employee
        await employeeService.createEmployee(employeeData);
        toast.success(`Employee ${data.name} created successfully`);
      }
      
      // Refresh the employee list and close the form
      await fetchEmployees();
      setShowEmployeeForm(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Error saving employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleCancelEmployeeForm() {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  }
  
  async function handleDeleteEmployee(employee: Employee) {
    if (!confirm(`Are you sure you want to delete ${employee.name}?`)) {
      return;
    }
    
    try {
      await employeeService.deleteEmployee(employee._id);
      toast.success(`Employee ${employee.name} deleted successfully`);
      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent">
            Employee Management
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Manage {organizationName}'s workforce
            {hasFeature('employeeManagement') && canAddEmployees && ' • Advanced features enabled'}
          </p>
        </div>

        {!showEmployeeForm && (
          <EmployeeLimitGate 
            currentCount={employees.length}
            fallback={
              <FeatureButton
                feature="employeeManagement"
                onClick={() => setShowEmployeeForm(true)}
                className="rounded-xl"
              >
                <PlusCircle size={18} className="mr-2" />
                Add Employee (Upgrade Required)
              </FeatureButton>
            }
          >
            <Button 
              variant="primary"
              leftIcon={<PlusCircle size={18} />}
              onClick={() => setShowEmployeeForm(true)}
              className="rounded-xl"
            >
              Add Employee
            </Button>
          </EmployeeLimitGate>
        )}
      </div>

      {/* Subscription Status */}
      <SubscriptionStatus compact={true} />

      {/* Employee Stats */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Current Employees</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{employees.length}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Plan Limit</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {getMaxEmployees() === -1 ? '∞' : getMaxEmployees()}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Available Spots</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">
              {getMaxEmployees() === -1 ? '∞' : Math.max(0, getMaxEmployees() - employees.length)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {showEmployeeForm ? (
        <EmployeeForm
          employee={editingEmployee || undefined}
          onSubmit={handleEmployeeSubmit}
          onCancel={handleCancelEmployeeForm}
          isLoading={isSubmitting}
          organizationId={organizationId || undefined}
        />
      ) : (
        <EmployeeTable
          employees={employees}
          onEdit={handleEditEmployee}
          onDelete={handleDeleteEmployee}
          onAdd={() => setShowEmployeeForm(true)}
          onRefresh={fetchEmployees}
          isLoading={loadingEmployees}
        />
      )}
    </div>
  );
};

export default OrganizationEmployees;