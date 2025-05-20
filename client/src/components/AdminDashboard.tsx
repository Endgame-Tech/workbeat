import React, { useEffect, useState, useCallback } from 'react';
import DashboardStats from './DashboardStats';
import AttendanceTable from './AttendanceTable';
import EmployeeForm from './admin/EmployeeForm';
// import EmployeeCard from './admin/EmployeeCard';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Layers, Settings, Calendar, Clock, Download, Users, PlusCircle, Search, RefreshCw } from 'lucide-react';
import Button from './ui/Button';
// import Input from './ui/Input';
import { Employee, AttendanceRecord } from '../types';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { toast } from 'react-hot-toast';
import EmployeeTable from './admin/EmployeeTable';

enum DashboardTab {
  OVERVIEW,
  REPORTS,
  WORKERS
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.OVERVIEW);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('Your Organization');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Extract organization ID and name on mount
  useEffect(() => {
    const orgId = employeeService.getCurrentOrganizationId();
    console.log("Retrieved organization ID:", orgId);
    setOrganizationId(orgId);
    
    // Try to get organization name from localStorage
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

  // Define fetchAttendanceRecords as a useCallback to prevent recreation on each render
  const fetchAttendanceRecords = useCallback(async () => {
    if (!organizationId) {
      console.warn('Cannot fetch attendance records: Missing organization ID');
      return;
    }
    
    setLoadingAttendance(true);
    try {
      console.log('Fetching attendance records for organization:', organizationId);
      const records = await attendanceService.getAllAttendanceRecords(100);
      console.log(`Fetched ${records.length} attendance records`);
      setAttendanceRecords(records);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to load attendance records');
      setAttendanceRecords([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [organizationId]);

  // Define fetchEmployees as a useCallback
  const fetchEmployees = useCallback(async () => {
    if (!organizationId) {
      console.warn('Cannot fetch employees: Missing organization ID');
      return;
    }
    
    setLoadingEmployees(true);
    try {
      console.log('Fetching employees for organization:', organizationId);
      const data = await employeeService.getAllEmployees();
      console.log('Fetched employees:', data);
      
      // Important: Make sure you're setting state with the new data
      setEmployees(data || []);
      
      // Double check that data was received
      if (!data || data.length === 0) {
        console.warn('No employees returned from API');
      }
    } catch (err) {
      console.error('Error in fetch operation:', err);
      toast.error('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  }, [organizationId]);

  // Fetch employees and attendance data on mount and when organizationId changes
  useEffect(() => {
    if (organizationId) {
      console.log("Organization ID is available, fetching data:", organizationId);
      fetchEmployees();
      fetchAttendanceRecords();
    } else {
      console.warn("No organization ID available yet, data fetch delayed");
    }
  }, [organizationId, fetchEmployees, fetchAttendanceRecords]);

  // Set up auto-refresh for attendance records
  useEffect(() => {
    if (!autoRefresh) return;
    
    // Auto-refresh attendance records every 30 seconds
    const refreshInterval = setInterval(() => {
      if (activeTab === DashboardTab.OVERVIEW || activeTab === DashboardTab.REPORTS) {
        console.log('Auto-refreshing attendance records...');
        fetchAttendanceRecords();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [autoRefresh, activeTab, fetchAttendanceRecords]);

  // Handle tab changes to refresh relevant data
  useEffect(() => {
    // Refresh relevant data when switching tabs
    if (activeTab === DashboardTab.WORKERS) {
      fetchEmployees();
    } else if (activeTab === DashboardTab.REPORTS || activeTab === DashboardTab.OVERVIEW) {
      fetchAttendanceRecords();
    }
  }, [activeTab, fetchEmployees, fetchAttendanceRecords]);

  // In AdminDashboard.jsx
  function handleEditEmployee(employee: Employee) {
    console.log("Employee to edit:", employee);
    console.log("Employee ID value:", employee.id || employee._id);
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  }

  const handleEmployeeSubmit = async (data: Partial<Employee>) => {
  console.log('Form data received:', data);
  setIsSubmitting(true);

  try {
    // Format dates properly if they exist
    if (data.startDate && typeof data.startDate === 'string' && !data.startDate.includes('T')) {
      data.startDate = new Date(data.startDate).toISOString();
    }
    
    // Ensure the organization ID is set
    const employeeData = {
      ...data,
      organizationId: organizationId || undefined
    };
    
    if (!employeeData.organizationId) {
      throw new Error('Organization ID is required');
    }
    
    if (editingEmployee) {
      // Get the ID, handling both potential formats (_id or id)
      const employeeId = editingEmployee._id || editingEmployee.id;
      console.log('Updating employee with ID:', employeeId);
      
      // Update existing employee
      await employeeService.updateEmployee(String(employeeId), employeeData);
      toast.success(`Employee ${data.name} updated successfully`);
    } else {
      // Create new employee
      await employeeService.createEmployee(employeeData);
      toast.success(`Employee ${data.name} created successfully`);
    }
    
    // Refresh the employee list and close the form
    await fetchEmployees();
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  } catch (error) {
    console.error('Error saving employee:', error);
    toast.error('Error saving employee. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  function handleCancelEmployeeForm() {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  }
  
  async function handleDeleteEmployee(employee: Employee) {
    if (!confirm(`Are you sure you want to delete ${employee.name}?`)) {
      return;
    }
    
    try {
      await employeeService.deleteEmployee(employee._id);
      toast.success(`Employee ${employee.name} deleted successfully`);
      // Refresh employee list
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  }

  // Manual refresh function for attendance records
  const refreshAttendanceRecords = () => {
    fetchAttendanceRecords();
    toast.success('Refreshing attendance records...');
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderTabContent = () => {
    switch (activeTab) {
        
      case DashboardTab.REPORTS:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Attendance Reports</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshAttendanceRecords}
                  isLoading={loadingAttendance}
                  className="ml-2 p-1 rounded-full"
                >
                  <RefreshCw size={16} />
                </Button>
                <span className="text-xs text-gray-500 ml-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="autoRefresh" 
                    checked={autoRefresh} 
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="autoRefresh" className="text-sm text-gray-600 dark:text-gray-300">
                    Auto-refresh
                  </label>
                </div>
                <Button 
                  variant="primary" 
                  leftIcon={<Download size={18} />}
                  onClick={() => exportAttendanceData()}
                  disabled={attendanceRecords.length === 0}
                >
                  Export Data
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[ 'Daily', 'Weekly', 'Monthly' ].map(period => (
                <Card key={period}>
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                      <Calendar size={18} className="mr-2" />
                      {period} Report
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Attendance summary for {period.toLowerCase()}
                    </p>
                    <Button variant="ghost" className="w-full">Generate Report</Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <AttendanceTable 
              records={attendanceRecords} 
              isAdmin={true}
              organizationId={organizationId || undefined}
              onRefresh={refreshAttendanceRecords}
            />
          </div>
        );
        
      case DashboardTab.WORKERS:
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {organizationName} Employees
              </h2>
              {!showEmployeeForm && (
                <Button 
                  variant="primary"
                  leftIcon={<PlusCircle size={18} />}
                  onClick={() => setShowEmployeeForm(true)}
                >
                  Add Employee
                </Button>
              )}
            </div>

            {showEmployeeForm ? (
              <EmployeeForm
                employee={editingEmployee || undefined}
                onSubmit={handleEmployeeSubmit}
                onCancel={handleCancelEmployeeForm}
                isLoading={isSubmitting}
                organizationId={organizationId || undefined}
              />
            ) : (
              <EmployeeTable
                employees={employees}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
                onAdd={() => setShowEmployeeForm(true)}
                onRefresh={fetchEmployees}
                isLoading={loadingEmployees}
              />
            )}
          </div>
        );
      
      default:
        return (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                Dashboard Overview
              </h2>
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshAttendanceRecords}
                  isLoading={loadingAttendance}
                  className="mr-4"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh Data
                </Button>
                <div className="text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>
          
            <DashboardStats 
              employeeCount={employees.filter(emp => emp.isActive).length} 
              attendanceRecords={attendanceRecords} 
              organizationName={organizationName}
            />
            
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">
                  Recent Attendance
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="autoRefreshOverview" 
                      checked={autoRefresh} 
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="autoRefreshOverview" className="text-sm text-gray-600 dark:text-gray-300">
                      Auto-refresh
                    </label>
                  </div>
                </div>
              </div>
            
              {loadingAttendance ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-600 dark:text-gray-300">Loading attendance records...</p>
                  </CardContent>
                </Card>
              ) : (
                <AttendanceTable 
                  records={attendanceRecords.slice(0, 10)} // Show only most recent 10 records on overview
                  isAdmin={true}
                  organizationId={organizationId || undefined}
                  onRefresh={refreshAttendanceRecords}
                />
              )}
            </div>
          </>
        );
    }
  };

  // Helper function to export attendance data as CSV
  const exportAttendanceData = () => {
    if (attendanceRecords.length === 0) return;
    
    // Create CSV content
    const headers = ['Employee ID', 'Employee Name', 'Type', 'Timestamp', 'Status', 'Notes'];
    
    const csvRows = [
      headers.join(','),
      ...attendanceRecords.map(record => {
        const employee = employees.find(emp => emp._id === record.employeeId);
        return [
          record.employeeId,
          employee?.name || record.employeeName || 'Unknown',
          record.type,
          new Date(record.timestamp).toLocaleString(),
          record.isLate ? 'Late' : record.type === 'sign-in' ? 'On Time' : 'Sign Out',
          record.notes?.replace(/,/g, ' ') || ''
        ].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create a download link and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${organizationName}_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Attendance data exported successfully');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Organization
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {organizationName}
                </p>
              </div>
            
              <div className="space-y-2">
                <Button
                  variant={activeTab === DashboardTab.OVERVIEW ? 'primary' : 'ghost'}
                  onClick={() => setActiveTab(DashboardTab.OVERVIEW)}
                  leftIcon={<Layers size={18} />}
                  className="w-full justify-start"
                >
                  Overview
                </Button>

                <Button
                  variant={activeTab === DashboardTab.REPORTS ? 'primary' : 'ghost'}
                  onClick={() => setActiveTab(DashboardTab.REPORTS)}
                  leftIcon={<Clock size={18} />}
                  className="w-full justify-start"
                >
                  Reports
                </Button>
                <Button
                  variant={activeTab === DashboardTab.WORKERS ? 'primary' : 'ghost'}
                  onClick={() => setActiveTab(DashboardTab.WORKERS)}
                  leftIcon={<Users size={18} />}
                  className="w-full justify-start"
                >
                  Employees
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="ghost" leftIcon={<Settings size={18} />} className="w-full justify-start">
                    Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;