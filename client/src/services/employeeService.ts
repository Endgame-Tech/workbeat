// Updated employeeService.ts with organization filtering
import api from './api';
import { Employee } from '../types';

// Helper function to get current organization ID
const getCurrentOrganizationId = (): string | null => {
  try {
    const userString = localStorage.getItem('user');
    if (userString) {
      // Handle the case where "user" might be prepended
      const jsonString = userString.startsWith('user{') 
        ? userString.substring(4) 
        : userString;
      
      try {
        const userData = JSON.parse(jsonString);
        return userData.organizationId || null;
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    return null;
  } catch (err) {
    console.error('Error getting organization ID:', err);
    return null;
  }
};

// Get all employees for current organization
const getAllEmployees = async (activeOnly: boolean = false) => {
  try {
    // Build query parameters
    let queryParams = '';
    
    if (activeOnly) {
      queryParams = '?isActive=true';
    }
    
    const response = await api.get(`/api/employees${queryParams}`);
    console.log('getAllEmployees response:', response.data);
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    throw error;
  }
};

// Get employee by ID (ensuring it belongs to current organization)
const getEmployeeById = async (id: string) => {
  try {
    // Backend will verify this employee belongs to the user's organization
    const response = await api.get(`/api/employees/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error in getEmployeeById:', error);
    throw error;
  }
};

// Create new employee (automatically assigned to current organization)
const createEmployee = async (employeeData: Partial<Employee>) => {
  try {
    // Ensure the organizationId is included in the request
    const dataToSubmit = { ...employeeData };
    
    if (!dataToSubmit.organizationId) {
      const organizationId = getCurrentOrganizationId();
      
      if (organizationId) {
        dataToSubmit.organizationId = organizationId;
        console.log('Added organizationId from current user:', organizationId);
      } else {
        console.error('No organization ID found for creating employee');
        throw new Error('Organization ID not found. Please log out and log in again.');
      }
    }

    console.log('Creating employee with data:', dataToSubmit);
    const response = await api.post('/api/employees', dataToSubmit);
    console.log('Employee created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error in createEmployee:', error);
    throw error;
  }
};

// Update employee (ensuring it belongs to current organization)
const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
  try {
    // Backend will verify this employee belongs to the user's organization
    const response = await api.put(`/api/employees/${id}`, employeeData);
    return response.data.data;
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    throw error;
  }
};

// Delete employee (ensuring it belongs to current organization)
const deleteEmployee = async (id: string) => {
  try {
    // Backend will verify this employee belongs to the user's organization
    await api.delete(`/api/employees/${id}`);
    return true;
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    throw error;
  }
};

// Toggle employee active status (using updateEmployee)
const toggleEmployeeStatus = async (id: string, isActive: boolean): Promise<Employee> => {
  try {
    console.log(`Toggling employee ${id} status to ${isActive ? 'active' : 'inactive'}`);
    const response = await updateEmployee(id, { isActive });
    return response;
  } catch (error) {
    console.error('Error toggling employee status:', error);
    throw error;
  }
};

// Search employees with more filters
const searchEmployees = async (searchParams: {
  name?: string;
  email?: string;
  department?: string;
  isActive?: boolean;
}) => {
  try {
    // Build query string from search parameters
    const queryParams = new URLSearchParams();
    
    if (searchParams.name) {
      queryParams.append('name', searchParams.name);
    }
    if (searchParams.email) {
      queryParams.append('email', searchParams.email);
    }
    if (searchParams.department) {
      queryParams.append('department', searchParams.department);
    }
    if (searchParams.isActive !== undefined) {
      queryParams.append('isActive', searchParams.isActive.toString());
    }
    
    // Make the API call with query parameters
    const response = await api.get(`/api/employees?${queryParams.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error('Error searching employees:', error);
    throw error;
  }
};

export const employeeService = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployees,
  getCurrentOrganizationId,
  toggleEmployeeStatus
};