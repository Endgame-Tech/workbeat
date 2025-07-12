import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../../services/api';

// Define the organization type
interface Organization {
  id: string;
  name?: string;
  industry?: string;
  subscription?: {
    plan: string;
    status: string;
    endDate?: string;
  };
}

// Define the context type
interface OrganizationContextType {
  organizationId: string | null;
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
  setOrganization: (org: Organization) => void;
  refreshOrganization: () => void;
}

// Create the context with default values
export const OrganizationContext = createContext<OrganizationContextType>({
  organizationId: null,
  organization: null,
  isLoading: true,
  error: null,
  setOrganization: () => {},
  refreshOrganization: () => {}
});

interface OrganizationProviderProps {
  children: ReactNode;
}

// Provider component
export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organization, setOrganizationState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get organization ID from localStorage
  const getOrganizationIdFromStorage = (): string | null => {
    try {
      const userString = localStorage.getItem('user');
      
      if (!userString) {
        return null;
      }
      
      // Handle case where "user" might be prepended
      const jsonString = userString.startsWith('user{') 
        ? userString.substring(4) 
        : userString;
      
      try {
        const userData = JSON.parse(jsonString);
        
        if (userData.organizationId) {
          return userData.organizationId;
        } else if (userData.organization?.id) {
          return userData.organization.id;
        } else {
          console.log('❌ No organizationId found in user data');
        }
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
      
      return null;
    } catch (err) {
      console.error('Error getting organization ID from storage:', err);
      return null;
    }
  };

  // Function to load organization data from API
  const loadOrganization = async (orgId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the api instance which handles URL configuration
      const response = await api.get(`/organizations/${orgId}`);
      
      // With axios, successful responses are returned directly
      const data = response.data;
      
      if (data.success && data.data) {
        setOrganizationState({
          id: data.data._id,
          name: data.data.name,
          industry: data.data.industry,
          subscription: data.data.subscription
        });
      } else {
        // If API doesn't return full details, at least set the ID
        setOrganizationState({
          id: orgId
        });
      }
    } catch (err: unknown) {
      console.error('Error loading organization:', err);

      // Type guard for AxiosError
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { status?: number } }).response?.status === 'number'
      ) {
        const status = (err as { response: { status: number } }).response.status;
        // Handle 404 as expected case for new organizations
        if (status === 404) {
          setOrganizationState({
            id: orgId
          });
        } else {
          // Only set error for actual server errors, not 404s
          setError('Failed to load organization data');

          // Still set the basic organization with ID
          setOrganizationState({
            id: orgId
          });
        }
      } else {
        setError('Failed to load organization data');
        setOrganizationState({
          id: orgId
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Set organization state
  const setOrganization = (org: Organization) => {
    setOrganizationState(org);
    setOrganizationId(org.id);
  };

  // Refresh organization data
  const refreshOrganization = () => {
    const orgId = getOrganizationIdFromStorage();
    if (orgId) {
      loadOrganization(orgId);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    const orgId = getOrganizationIdFromStorage();
    
    if (orgId) {
      setOrganizationId(orgId);
      loadOrganization(orgId);
    } else {
      setIsLoading(false);
      setError('Organization ID not found');
    }
  }, []);

  return (
    <OrganizationContext.Provider 
      value={{ 
        organizationId, 
        organization, 
        isLoading, 
        error,
        setOrganization,
        refreshOrganization
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};