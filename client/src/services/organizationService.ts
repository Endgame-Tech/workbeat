
import api from './api';
import {
  OrganizationSettings,
  SubscriptionData,
  OrganizationUserData,
  DepartmentData,
  Holiday
} from '../types';

export interface RegisterOrganizationData {
  name: string;
  email: string;
  address?: string;
  phone?: string;
  // Add other required fields here
}

// Organization management service
export const organizationService = {
  /**
   * Register a new organization
   * @param organizationData The organization data to register
   * @returns The registered organization and admin user data
   */
  async registerOrganization(organizationData: RegisterOrganizationData) {
    try {
      const response = await api.post('/api/organizations/register', organizationData);
      return response.data.data;
    } catch (error) {
      console.error('Organization registration error:', error);
      throw error;
    }
  },

  /**
   * Get organization details
   * @param organizationId The ID of the organization
   * @returns The organization data
   */
  async getOrganization(organizationId: string) {
    try {
      const response = await api.get(`/api/organizations/${organizationId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      // Only log detailed error info in development
      if (
        process.env.NODE_ENV === 'development' &&
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const err = error as { response: { data: unknown; status: unknown } };
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      throw error;
    }
  },

  /**
   * Update organization details
   * @param organizationId The ID of the organization
   * @param organizationData The updated organization data
   * @returns The updated organization
   */
  async updateOrganization(organizationId: string, organizationData: RegisterOrganizationData) {
    try {
      const response = await api.put(
        `/api/organizations/${organizationId}`,
        organizationData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  },

  /**
   * Get subscription details
   * @param organizationId The ID of the organization
   * @returns The subscription details
   */
  async getSubscription(organizationId: string) {
    try {
      const response = await api.get(`/api/organizations/${organizationId}/subscription`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  },

  /**
   * Update subscription
   * @param organizationId The ID of the organization
   * @param subscriptionData The updated subscription data
   * @returns The updated subscription
   */
  async updateSubscription(organizationId: string, subscriptionData: SubscriptionData) {
    try {
      const response = await api.put(
        `/api/organizations/${organizationId}/subscription`,
        subscriptionData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  /**
   * Get organization statistics
   * @param organizationId The ID of the organization
   * @returns Organization statistics
   */
  async getOrganizationStats(organizationId: string) {
    try {
      const response = await api.get(`/api/organizations/${organizationId}/stats`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching organization stats:', error);
      throw error;
    }
  },

  /**
   * Get all users in an organization
   * @param organizationId The ID of the organization
   * @returns List of organization users
   */
  async getOrganizationUsers(organizationId: string) {
    try {
      const response = await api.get(`/api/organizations/${organizationId}/users`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching organization users:', error);
      throw error;
    }
  },

  /**
   * Add user to organization
   * @param organizationId The ID of the organization
   * @param userData The user data to add
   * @returns The added user
   */
  async addOrganizationUser(organizationId: string, userData: OrganizationUserData) {
    try {
      const response = await api.post(
        `/api/organizations/${organizationId}/users`,
        userData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error adding organization user:', error);
      throw error;
    }
  },

  /**
   * Update organization user
   * @param organizationId The ID of the organization
   * @param userId The ID of the user to update
   * @param userData The updated user data
   * @returns The updated user
   */
  async updateOrganizationUser(organizationId: string, userId: string, userData: OrganizationUserData) {
    try {
      const response = await api.put(
        `/api/organizations/${organizationId}/users/${userId}`,
        userData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating organization user:', error);
      throw error;
    }
  },

  /**
   * Remove user from organization
   * @param organizationId The ID of the organization
   * @param userId The ID of the user to remove
   * @returns Success status
   */
  async removeOrganizationUser(organizationId: string, userId: string) {
    try {
      const response = await api.delete(
        `/api/organizations/${organizationId}/users/${userId}`
      );
      return response.data.success;
    } catch (error) {
      console.error('Error removing organization user:', error);
      throw error;
    }
  },

  // Department Management Methods

  /**
   * Get all departments in an organization
   * @param organizationId The ID of the organization
   * @returns List of departments
   */
  async getDepartments(organizationId: string) {
    try {
      const response = await api.get(`/api/organizations/${organizationId}/departments`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  /**
   * Create a new department
   * @param organizationId The ID of the organization
   * @param departmentData The department data to create
   * @returns The created department
   */
  async createDepartment(organizationId: string, departmentData: DepartmentData) {
    try {
      const response = await api.post(
        `/api/organizations/${organizationId}/departments`,
        departmentData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating department:', error);
      throw error;
    }
  },

  /**
   * Update a department
   * @param organizationId The ID of the organization
   * @param departmentId The ID of the department to update
   * @param departmentData The updated department data
   * @returns The updated department
   */
  async updateDepartment(organizationId: string, departmentId: string, departmentData: DepartmentData) {
    try {
      const response = await api.put(
        `/api/organizations/${organizationId}/departments/${departmentId}`,
        departmentData
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },

  /**
   * Delete a department
   * @param organizationId The ID of the organization
   * @param departmentId The ID of the department to delete
   * @returns Success status
   */
  async deleteDepartment(organizationId: string, departmentId: string) {
    try {
      const response = await api.delete(
        `/api/organizations/${organizationId}/departments/${departmentId}`
      );
      return response.data.success;
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },

  // Settings and Configuration Methods

  /**
   * Get organization settings
   * @param organizationId The ID of the organization
   * @returns Organization settings
   */
  async getSettings(organizationId: string) {
    try {
      const response = await api.get(`/api/organizations/${organizationId}/settings`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching organization settings:', error);
      throw error;
    }
  },

  /**
   * Update organization settings
   * @param organizationId The ID of the organization
   * @param settings The settings to update
   * @returns Updated settings
   */
  async updateSettings(organizationId: string, settings: OrganizationSettings) {
    try {
      const response = await api.put(
        `/api/organizations/${organizationId}/settings`,
        settings
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating organization settings:', error);
      throw error;
    }
  },

  /**
   * Reset organization settings to defaults
   * @param organizationId The ID of the organization
   * @returns Success status
   */
  async resetSettings(organizationId: string) {
    try {
      const response = await api.post(`/api/organizations/${organizationId}/settings/reset`);
      return response.data.success;
    } catch (error) {
      console.error('Error resetting organization settings:', error);
      throw error;
    }
  },

  // Data Export Methods

  /**
   * Export organization data
   * @param organizationId The ID of the organization
   * @param exportType The type of export (csv, json, pdf)
   * @returns Export data or download link
   */
  async exportData(organizationId: string, exportType: 'csv' | 'json' | 'pdf' = 'json') {
    try {
      const response = await api.get(
        `/api/organizations/${organizationId}/export?format=${exportType}`,
        { responseType: exportType === 'pdf' ? 'blob' : 'json' }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting organization data:', error);
      throw error;
    }
  },

  // Audit and Logging Methods

  /**
   * Get organization audit logs
   * @param organizationId The ID of the organization
   * @param limit Number of logs to fetch
   * @param offset Offset for pagination
   * @returns Audit logs
   */
  async getAuditLogs(organizationId: string, limit: number = 50, offset: number = 0) {
    try {
      const response = await api.get(
        `/api/organizations/${organizationId}/audit-logs?limit=${limit}&offset=${offset}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  // Holiday and Calendar Methods

  /**
   * Get organization holiday calendar
   * @param organizationId The ID of the organization
   * @param year The year to fetch holidays for
   * @returns Holiday calendar
   */
  async getHolidayCalendar(organizationId: string, year?: number) {
    try {
      const yearParam = year ? `?year=${year}` : '';
      const response = await api.get(`/api/organizations/${organizationId}/holidays${yearParam}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching holiday calendar:', error);
      throw error;
    }
  },

  /**
   * Update organization holiday calendar
   * @param organizationId The ID of the organization
   * @param holidays Array of holiday objects
   * @returns Updated holiday calendar
   */
  async updateHolidayCalendar(organizationId: string, holidays: Holiday[]) {
    try {
      const response = await api.put(
        `/api/organizations/${organizationId}/holidays`,
        { holidays }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating holiday calendar:', error);
      throw error;
    }
  }
};

export default organizationService;