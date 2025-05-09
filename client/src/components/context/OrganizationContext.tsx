import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
const OrganizationContext = createContext<OrganizationContextType>({
  organizationId: null,
  organization: null,
  isLoading: true,
  error: null,
  setOrganization: () => {},
  refreshOrganization: () => {}
});

// Custom hook to use the organization context
export const useOrganization = () => useContext(OrganizationContext);

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
      if (!userString) return null;
      
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
      // You'll need to implement this API endpoint
      const response = await fetch(`/api/organizations/${orgId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load organization data');
      }
      
      const data = await response.json();
      
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
    } catch (err) {
      console.error('Error loading organization:', err);
      setError('Failed to load organization data');
      
      // Still set the basic organization with ID
      setOrganizationState({
        id: orgId
      });
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