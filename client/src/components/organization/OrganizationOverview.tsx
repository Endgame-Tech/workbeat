// OrganizationOverview.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import DashboardStats from '../DashboardStats';
import AttendanceTable from '../AttendanceTable';
import { Card, CardContent } from '../ui/Card';
import { RefreshCw, Clock, TrendingUp, Activity, Users, Plus } from 'lucide-react';
import Button from '../ui/Button';
import { AttendanceRecord } from '../../types';
import { employeeService } from '../../services/employeeService';
import { attendanceService } from '../../services/attendanceService';
import { useOrganizationState } from '../../hooks/useOrganizationState';
import { toast } from 'react-hot-toast';

const OrganizationOverview: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [organizationName, setOrganizationName] = useState<string>('Your Organization');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  // Use organization state hook
  const orgState = useOrganizationState(organizationId);

  // Extract organization name on mount
  useEffect(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        if (userData.organizationName) {
          setOrganizationName(userData.organizationName);
        }
      }
    } catch (error) {
      console.error('Error getting organization name:', error);
    }
  }, []);

  // Define fetchAttendanceRecords as a useCallback
  const fetchAttendanceRecords = useCallback(async () => {
    if (!organizationId) {
      console.warn('Cannot fetch attendance records: Missing organization ID');
      return [];
    }
    
    setLoadingAttendance(true);
    try {
      console.log('Fetching attendance records for organization:', organizationId);
      const records = await attendanceService.getAllAttendanceRecords(100);
      console.log(`Fetched ${records.length} attendance records`);
      
      setAttendanceRecords(records);
      setLastUpdated(new Date());
      
      return records;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      // Only show error toast for actual server errors, not empty data
      if (error.isServerError) {
        toast.error('Failed to load attendance records');
      }
      setAttendanceRecords([]);
      return [];
    } finally {
      setLoadingAttendance(false);
    }
  }, [organizationId]);

  // Define fetchEmployees as a useCallback
  const fetchEmployees = useCallback(async () => {
    if (!organizationId) {
      console.warn('Cannot fetch employees: Missing organization ID');
      return [];
    }
    
    try {
      console.log('Fetching employees for organization:', organizationId);
      const data = await employeeService.getAllEmployees();
      console.log('Fetched employees:', data);
      
      setEmployees(data || []);
      return data || [];
    } catch (err) {
      console.error('Error in fetch operation:', err);
      // Only show error toast for actual server errors, not missing employees
      if (err.isServerError) {
        toast.error('Failed to load employees');
      }
      setEmployees([]);
      return [];
    }
  }, [organizationId]);

  // Fetch employees and attendance data on mount
  useEffect(() => {
    if (!organizationId || orgState.isLoading) return;
    
    console.log("Organization ID is available, checking if should fetch data:", organizationId);
    
    // Always try to fetch employees first to determine org state
    fetchEmployees();
    
    // Only fetch attendance if we have employees or should fetch data
    if (orgState.shouldFetchData('attendance')) {
      console.log("Fetching attendance data...");
      fetchAttendanceRecords();
    } else {
      console.log("Skipping attendance fetch - new organization with no employees");
      setAttendanceRecords([]);
    }
  }, [organizationId, orgState.isLoading, orgState.hasEmployees, fetchEmployees, fetchAttendanceRecords]);

  // Set up auto-refresh for attendance records
  useEffect(() => {
    if (!autoRefresh) return;
    
    // Auto-refresh attendance records every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing attendance records...');
      fetchAttendanceRecords();
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [autoRefresh, fetchAttendanceRecords]);

  // Manual refresh function for attendance records
  const refreshAttendanceRecords = () => {
    fetchAttendanceRecords();
    toast.success('Refreshing attendance records...');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Real-time insights into your organization's attendance and performance
          </p>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshAttendanceRecords}
            disabled={loadingAttendance}
            leftIcon={<RefreshCw size={16} className={loadingAttendance ? 'animate-spin' : ''} />}
            className="rounded-lg"
          >
            Refresh
          </Button>
        </div>
      </div>
    
      {/* Show empty state for new organizations */}
      {orgState.isNewOrganization && !orgState.isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users size={48} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  Welcome to {organizationName}!
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Get started by adding your first employee to begin tracking attendance.
                </p>
                <Button 
                  variant="primary" 
                  leftIcon={<Plus size={16} />}
                  onClick={() => window.location.href = `/organization/${organizationId}/employees`}
                >
                  Add First Employee
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Dashboard Stats */}
          <DashboardStats 
            employeeCount={employees.filter(emp => emp.isActive).length} 
            attendanceRecords={attendanceRecords}
          />
        </>
      )}
      
      {/* Recent Attendance Section - Only show if we have employees */}
      {!orgState.isNewOrganization && (
      <Card>
        <CardContent className="p-6">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Activity size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Recent Attendance
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Latest check-ins and check-outs from your team
                </p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoRefresh} 
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Auto-refresh
                </span>
              </label>
              <div className="text-sm text-neutral-500 dark:text-neutral-400 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                {attendanceRecords.length} total records
              </div>
            </div>
          </div>
        
          {/* Table Content */}
          {loadingAttendance ? (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-neutral-600 dark:text-neutral-300 font-medium">
                  Loading attendance records...
                </p>
              </div>
            </div>
          ) : (
            <AttendanceTable 
              records={attendanceRecords.slice(0, 10)} // Show only most recent 10 records on overview
              isAdmin={true}
              organizationId={organizationId || undefined}
              onRefresh={refreshAttendanceRecords}
            />
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default OrganizationOverview;