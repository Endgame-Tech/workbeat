import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../services/employeeService';

interface OrganizationState {
  hasEmployees: boolean;
  employeeCount: number;
  isNewOrganization: boolean;
  isLoading: boolean;
  lastChecked: Date | null;
}

export const useOrganizationState = (organizationId?: string) => {
  const [state, setState] = useState<OrganizationState>({
    hasEmployees: false,
    employeeCount: 0,
    isNewOrganization: true,
    isLoading: false,
    lastChecked: null
  });

  const checkOrganizationState = useCallback(async () => {
    if (!organizationId) return;

    // Don't check too frequently
    if (state.lastChecked && Date.now() - state.lastChecked.getTime() < 30000) {
      return state;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const employees = await employeeService.getAllEmployees();
      const employeeCount = employees?.length || 0;
      const hasEmployees = employeeCount > 0;
      
      setState({
        hasEmployees,
        employeeCount,
        isNewOrganization: employeeCount === 0,
        isLoading: false,
        lastChecked: new Date()
      });

      return {
        hasEmployees,
        employeeCount,
        isNewOrganization: employeeCount === 0,
        isLoading: false,
        lastChecked: new Date()
      };
    } catch {
      // If we can't fetch employees, assume it's a new organization
      setState({
        hasEmployees: false,
        employeeCount: 0,
        isNewOrganization: true,
        isLoading: false,
        lastChecked: new Date()
      });

      return {
        hasEmployees: false,
        employeeCount: 0,
        isNewOrganization: true,
        isLoading: false,
        lastChecked: new Date()
      };
    }
  }, [organizationId, state]);

  // Check state on mount
  useEffect(() => {
    if (organizationId) {
      checkOrganizationState();
    }
  }, [organizationId, checkOrganizationState]);

  const shouldFetchData = useCallback((dataType: 'attendance' | 'analytics' | 'leave') => {
    // Don't fetch data if we're still loading the organization state
    if (state.isLoading) return false;

    // For new organizations with no employees, don't fetch most data
    if (state.isNewOrganization) {
      // Only allow fetching leave types and basic organization data
      return dataType === 'leave';
    }

    return true;
  }, [state.isLoading, state.isNewOrganization]);

  return {
    ...state,
    checkOrganizationState,
    shouldFetchData,
    refreshState: checkOrganizationState
  };
};