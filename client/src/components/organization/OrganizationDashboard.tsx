import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { organizationService } from '../../services/organizationService';
import { UsersIcon, Clock, CheckCircle, AlertTriangle, Building, Settings } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

interface OrganizationDashboardProps {
  organizationId: string;
}

interface OrganizationStats {
  employeeCount: number;
  activeEmployees: number;
  totalAttendance: number;
  onTimeRate: number;
  lateRate: number;
  departments: {
    name: string;
    employeeCount: number;
  }[];
  recentEvents: {
    type: string;
    message: string;
    timestamp: string;
  }[];
}

const OrganizationDashboard: React.FC<OrganizationDashboardProps> = ({ organizationId }) => {
  const [organization, setOrganization] = useState<any>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        // Fetch organization details
        const orgData = await organizationService.getOrganization(organizationId);
        setOrganization(orgData);
        
        // Fetch organization statistics
        const statsData = await organizationService.getOrganizationStats(organizationId);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching organization data:', err);
        setError('Failed to load organization data');
        // Only show toast for server errors, not expected empty states
        if (err.isServerError) {
          toast.error('Failed to load organization dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganizationData();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 dark:text-gray-400">{error || 'Organization not found'}</p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {organization.name} Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organization management and statistics
          </p>
        </div>
        
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Link to={`/organization/${organizationId}/settings`}>
            <Button
              variant="ghost"
              leftIcon={<Settings size={18} />}
            >
              Settings
            </Button>
          </Link>
          
          <Link to={`/organization/${organizationId}/employees/new`}>
            <Button
              variant="primary"
              leftIcon={<UsersIcon size={18} />}
            >
              Add Employee
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Subscription Status Alert */}
      {organization.subscription.status === 'trial' && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-8 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-blue-500" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your trial ends in {getRemainingDays(organization.subscription.endDate)} days. 
                <Link to={`/organization/${organizationId}/subscription`} className="font-medium underline ml-1">
                  Upgrade now
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                  <UsersIcon size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.employeeCount}</p>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className="text-green-500 dark:text-green-400 font-medium">
                  {Math.round((stats.activeEmployees / stats.employeeCount) * 100)}% active
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">On-Time Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.onTimeRate}%</p>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {stats.lateRate}% late arrival rate
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Attendance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAttendance}</p>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <span className={`${
                  (stats.totalAttendance / stats.activeEmployees) > 0.9 
                    ? 'text-green-500 dark:text-green-400' 
                    : 'text-yellow-500 dark:text-yellow-400'
                } font-medium`}>
                  {Math.round((stats.totalAttendance / stats.activeEmployees) * 100)}% of active employees
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mr-4">
                  <Building size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Departments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.departments.length}</p>
                </div>
              </div>
              <div className="mt-4 text-sm">
                <Link to={`/organization/${organizationId}/departments`} className="text-blue-600 dark:text-blue-400 hover:underline">
                  View department details
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Departments and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Departments Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Departments</h2>
            </CardHeader>
            <CardContent>
              {stats && stats.departments.length > 0 ? (
                <div className="space-y-4">
                  {stats.departments.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold">
                          {dept.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{dept.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{dept.employeeCount} employees</p>
                        </div>
                      </div>
                      <Link to={`/organization/${organizationId}/departments/${dept.name}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No departments yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Create departments to better organize your workforce
                  </p>
                  <Link to={`/organization/${organizationId}/departments/new`}>
                    <Button variant="primary" size="sm">
                      Create Department
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h2>
            </CardHeader>
            <CardContent>
              {stats && stats.recentEvents && stats.recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentEvents.map((event, index) => (
                    <div key={index} className="border-l-2 border-blue-500 pl-3 py-1">
                      <p className="text-sm text-gray-900 dark:text-white">{event.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(event.timestamp)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Quick Access Panel */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to={`/organization/${organizationId}/employees`}>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                    <UsersIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Employees</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage your workforce</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to={`/organization/${organizationId}/attendance`}>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Attendance</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">View attendance records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to={`/organization/${organizationId}/reports`}>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Reports</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Generate insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to={`/organization/${organizationId}/settings`}>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mr-4">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Settings</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Configure your account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate remaining days in trial
function getRemainingDays(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = Math.abs(end.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Helper function to format timestamps as relative time
function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  return 'just now';
}

export default OrganizationDashboard;