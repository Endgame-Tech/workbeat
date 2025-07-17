// Updated employeeService.ts with organization filtering
import api from './api';
import { Employee } from '../types';

// Helper function to get current organization ID
const getCurrentOrganizationId = (): string | null => {
  try {
    const userString = localStorage.getItem('user');

    if (!userString) {
      return null;
    }
    
    // Handle the case where "user" might be prepended (unusual, but handling it anyway)
    const jsonString = userString.startsWith('user{') 
      ? userString.substring(4) 
      : userString;
    
    try {
      const userData = JSON.parse(jsonString);
      
      if (!userData.organizationId) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("No organizationId in user data");
        }
      }
      
      return userData.organizationId || null;
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error parsing user data:', err);
      }
      // Try a more flexible approach in case json is malformed
      const match = jsonString.match(/"organizationId"\s*:\s*"?(\d+)"?/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting organization ID:', err);
    }
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
    
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in getAllEmployees:', error);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in getEmployeeById:', error);
    }
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
      } else {
        throw new Error('Organization ID not found. Please log out and log in again.');
      }
    }

    const response = await api.post('/api/employees', dataToSubmit);
    return response.data.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in createEmployee:', error);
    }
    throw error;
  }
};

// Update employee (ensuring it belongs to current organization)
const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
  try {
    if (!id) {
      throw new Error("Employee ID is required");
    }
    
    // Make sure data is properly formatted for the backend
    // Format dates if any
    if (employeeData.startDate && !String(employeeData.startDate).includes('T')) {
      employeeData.startDate = new Date(employeeData.startDate).toISOString();
    }
    
    // Convert any JSON fields to strings if needed
    if (employeeData.workSchedule && typeof employeeData.workSchedule !== 'string') {
      employeeData.workSchedule = JSON.stringify(employeeData.workSchedule);
    }
    
    if (employeeData.faceRecognition && typeof employeeData.faceRecognition !== 'string') {
      employeeData.faceRecognition = JSON.stringify(employeeData.faceRecognition);
    }
    
    if (employeeData.biometrics && typeof employeeData.biometrics !== 'string') {
      employeeData.biometrics = JSON.stringify(employeeData.biometrics);
    }
    
    const response = await api.put(`/api/employees/${id}`, employeeData);
    return response.data.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in updateEmployee:', error);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in deleteEmployee:', error);
    }
    throw error;
  }
};

// Toggle employee active status (using updateEmployee)
const toggleEmployeeStatus = async (id: string, isActive: boolean): Promise<Employee> => {
  try {
    if (!id) {
      throw new Error("Employee ID is required to toggle status");
    }
    
    const response = await updateEmployee(id, { isActive });
    return response;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error toggling employee status:', error);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Error searching employees:', error);
    }
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