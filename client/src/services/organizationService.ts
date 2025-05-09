import api from './api';

// Organization management service
export const organizationService = {
  /**
   * Register a new organization
   * @param organizationData The organization data to register
   * @returns The registered organization and admin user data
   */
  async registerOrganization(organizationData: any) {
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
      throw error;
    }
  },

  /**
   * Update organization details
   * @param organizationId The ID of the organization
   * @param organizationData The updated organization data
   * @returns The updated organization
   */
  async updateOrganization(organizationId: string, organizationData: any) {
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
  async updateSubscription(organizationId: string, subscriptionData: any) {
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
  async addOrganizationUser(organizationId: string, userData: any) {
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
  async updateOrganizationUser(organizationId: string, userId: string, userData: any) {
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
  }
};

export default organizationService;