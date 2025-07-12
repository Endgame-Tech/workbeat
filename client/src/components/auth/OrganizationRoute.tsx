import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { organizationService } from '../../services/organizationService';

interface OrganizationRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const OrganizationRoute: React.FC<OrganizationRouteProps> = ({ children, adminOnly = false }) => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOrganizationAccess = async () => {
      console.log('OrganizationRoute: Checking access for organizationId:', organizationId);
      
      if (!organizationId) {
        console.log('OrganizationRoute: No organizationId provided');
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        // Get user data from localStorage
        const userString = localStorage.getItem('user');
        
        if (!userString) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
        
        const user = JSON.parse(userString);
        
        // Check if the user belongs to this organization
        // Convert both to strings for comparison to handle number/string mismatch
        const userOrgId = user.organizationId?.toString() || user.organization?.id?.toString();
        
        if (userOrgId !== organizationId) {
          console.log('Organization ID mismatch:', { userOrgId, routeOrgId: organizationId });
          // Try to get the organization to verify the user has access
          try {
            await organizationService.getOrganization(organizationId);
            setHasAccess(true);
          } catch (error) {
            console.error('Failed to verify organization access:', error);
            setHasAccess(false);
          }
        } else {
          setHasAccess(true);
        }
        
        // Check if the user is an admin if adminOnly is true
        setIsAdmin(['admin', 'owner'].includes(user.role || user.organizationRole));
      } catch (error) {
        console.error('Organization access check error:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkOrganizationAccess();
  }, [organizationId, adminOnly]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect if no access to this organization
  if (!hasAccess) {
    // Don't show error toast - just redirect quietly
    return <Navigate to="/dashboard" replace />;
  }

  // Check if admin access is required but user is not an admin
  if (adminOnly && !isAdmin) {
    // Don't show error toast - just redirect quietly
    return <Navigate to={`/organization/${organizationId}`} replace />;
  }

  // Clone the children with the organizationId prop
  const childrenWithProps = React.Children.map(children, child => {
    // Check if the child is a valid React element
    if (React.isValidElement(child)) {
      // Clone the child with the organizationId prop
      return React.cloneElement(child, { organizationId });
    }
    return child;
  });

  // If the user has access and meets admin requirements, render children
  return <>{childrenWithProps}</>;
};

export default OrganizationRoute;