import api from './api';

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
}


// Auth service for user authentication
export const authService = {
  /**
   * Login a user (admin)
   * @param email User email
   * @param password User password
   * @returns User data and token
   */
  async login(email: string, password: string) {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      
      if (response.data && response.data.success) {
        // Note: Token is now stored as secure httpOnly cookie by the server
        // No need to store token in localStorage anymore
        
        // Store user data
        if (response.data.data) {
          // Process user data to ensure organizationId is present
          const userData = response.data.data;
          
          // Add organizationId if it's missing but organization is present
          if (!userData.organizationId && userData.organization?.id) {
            userData.organizationId = userData.organization.id;
          }
          
          localStorage.setItem('user', JSON.stringify(userData));
          return userData;
        }
      }
      
      // If we get here, there's an issue with the response structure
      console.error('Unexpected response structure:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  /**
   * Register a new user (admin only)
   * @param userData The user data to register
   * @returns The registered user data
   */
  async register(userData: RegisterUserData) {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  /**
   * Get current logged in user
   * @returns Current user data
   */
  async getCurrentUser() {
    try {
      // First check if we have user in localStorage to avoid unnecessary API call
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const user = JSON.parse(userString);
          
          // Ensure organizationId is set correctly
          if (!user.organizationId) {
            // Check if the organizationId is in the organization field
            const orgString = localStorage.getItem('organization');
            if (orgString) {  
              try {
                const org = JSON.parse(orgString);
                if (org.id) {
                  user.organizationId = org.id;
                  localStorage.setItem('user', JSON.stringify(user));
                }
              } catch (error) {
                console.error('Error parsing organization data:', error);
              }
            }
            
            // If user has organization object but no organizationId
            if (!user.organizationId && user.organization?.id) {
              user.organizationId = user.organization.id;
              // Update the stored user data with the organizationId
              localStorage.setItem('user', JSON.stringify(user));
            }
          }
          
          // If we have user data, verify it's still valid with a lightweight API call
          await api.get('/api/auth/me');
          return user;
        } catch (error) {
          console.error('Update error:', error);
        }
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }
      
      const response = await api.get('/api/auth/me');
      
      // Process user data to ensure organizationId is present
      const userData = response.data.data;
      
      // Add organizationId if it's missing but organization is present
      if (!userData.organizationId && userData.organization?.id) {
        userData.organizationId = userData.organization.id;
      }
      
      // Store the updated user data
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
      // Clear storage on auth error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  },

  /**
   * Update user details
   * @param userData User data to update
   * @returns Updated user data
   */
  async updateDetails(userData: UpdateUserData) {
    try {
      const response = await api.put('/api/auth/updatedetails', userData);
      
      // Update user in localStorage if it exists
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        const updatedUser = { ...user, ...response.data.data };
        
        // Ensure organizationId is preserved
        if (user.organizationId && !updatedUser.organizationId) {
          updatedUser.organizationId = user.organizationId;
        }
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Update details error:', error);
      throw error;
    }
  },

  /**
   * Update user password
   * @param passwordData Object with currentPassword and newPassword
   * @returns Success message
   */
  async updatePassword(passwordData: { currentPassword: string; newPassword: string }) {
    try {
      const response = await api.put('/api/auth/updatepassword', passwordData);
      return response.data;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  /**
   * Forgot password request
   * @param email User email
   * @returns Success message
   */
  async forgotPassword(email: string) {
    try {
      const response = await api.post('/api/auth/forgotpassword', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param resetToken Password reset token
   * @param password New password
   * @returns Success message
   */
  async resetPassword(resetToken: string, password: string) {
    try {
      const response = await api.put(
        `/api/auth/resetpassword/${resetToken}`,
        { password }
      );
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      // Call logout endpoint to clear httpOnly cookie
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with cleanup even if API call fails
    } finally {
      // Clear local storage (no need to remove token since it's in httpOnly cookie)
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
    }
  },
  
  /**
   * Check if user is authenticated
   * @returns True if authenticated, false otherwise
   */
  async checkAuth(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }
      
      // Verify token is valid with a lightweight API call
      await api.get('/api/auth/me');
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      // Clear invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('organization'); // Also clear organization
      return false;
    }
  },
  
  /**
   * Get organization ID from various sources
   * @returns Organization ID if available
   */
  getOrganizationId(): string | null {
    try {
      // Try to get from user data first
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        
        // Check for organizationId directly in user object
        if (user.organizationId) {
          return user.organizationId;
        }
        
        // Check if the user has an organization object
        if (user.organization?.id) {
          return user.organization.id;
        }
      }
      
      // Try to get from organization data
      const orgString = localStorage.getItem('organization');
      if (orgString) {
        const org = JSON.parse(orgString);
        if (org.id) {
          return org.id;
        }
      }
      
      console.warn('No organization ID found in localStorage');
      return null;
    } catch (error) {
      console.error('Error retrieving organization ID:', error);
      return null;
    }
  }
};

export default authService;