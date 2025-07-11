import { useContext } from 'react';
import { OrganizationContext } from '../components/context/OrganizationContext';

// Custom hook to use the organization context
export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
