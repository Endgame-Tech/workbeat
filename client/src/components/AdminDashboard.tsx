// Complete Improved AdminDashboard.tsx with better report structure

import React, { useEffect, useState, useCallback } from 'react';
import DashboardStats from './DashboardStats';
import AttendanceTable from './AttendanceTable';
import EmployeeForm from './admin/EmployeeForm';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Layers, Settings, Calendar, Clock, Download, Users, PlusCircle, Search, RefreshCw, FileText } from 'lucide-react';
import Button from './ui/Button';
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

enum ReportType {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly'
}

enum ReportFormat {
  DETAILED = 'Detailed',
  EMPLOYEE_SUMMARY = 'Employee Summary',
  MONTHLY = 'Monthly Summary'
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
  const [exportingReport, setExportingReport] = useState<boolean>(false);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<ReportType | null>(null);
  const [reportFormat, setReportFormat] = useState<ReportFormat>(ReportFormat.EMPLOYEE_SUMMARY);

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
  const fetchAttendanceRecords = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!organizationId) {
      console.warn('Cannot fetch attendance records: Missing organization ID');
      return [];
    }
    
    setLoadingAttendance(true);
    try {
      console.log('Fetching attendance records for organization:', organizationId);
      
      // If dates are provided, use them for filtering
      let records;
      if (startDate && endDate) {
        console.log(`Fetching filtered records from ${startDate.toISOString()} to ${endDate.toISOString()}`);
        
        // Try to use attendance report endpoint if available
        try {
          records = await attendanceService.getAttendanceReport(
            startDate.toISOString().split('T')[0], 
            endDate.toISOString().split('T')[0]
          );
        } catch (reportError) {
          console.warn('Failed to fetch from report endpoint, using regular endpoint with filtering:', reportError);
          // Fallback to regular endpoint
          records = await attendanceService.getAllAttendanceRecords(500);
          
          // Filter records by date client-side
          records = records.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= startDate && recordDate <= endDate;
          });
        }
      } else {
        // Regular fetch for all recent records
        records = await attendanceService.getAllAttendanceRecords(100);
      }
      
      console.log(`Fetched ${records.length} attendance records`);
      
      // Only update state if not generating a report
      if (!startDate && !endDate) {
        setAttendanceRecords(records);
        setLastUpdated(new Date());
      }
      
      return records;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      if (!startDate && !endDate) {
        toast.error('Failed to load attendance records');
        setAttendanceRecords([]);
      }
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
      
      return data || [];
    } catch (err) {
      console.error('Error in fetch operation:', err);
      toast.error('Failed to load employees');
      setEmployees([]);
      return [];
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

  // Handle employee editing
  function handleEditEmployee(employee: Employee) {
    console.log("Employee to edit:", employee);
    console.log("Employee ID value:", employee.id || employee._id);
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  }

  // Handle employee form submission
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

  // Get date range for report types
  const getReportDateRange = (reportType: ReportType): { startDate: Date, endDate: Date } => {
    const endDate = new Date(); // Today
    endDate.setHours(23, 59, 59, 999); // End of today
    
    let startDate = new Date();
    
    switch (reportType) {
      case ReportType.DAILY:
        // Just today
        startDate.setHours(0, 0, 0, 0); // Beginning of today
        break;
      case ReportType.WEEKLY:
        // Last 7 days
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case ReportType.MONTHLY:
        // Last 30 days
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
    }
    
    return { startDate, endDate };
  };

  // Generate and export attendance report
  const generateReport = async (reportType: ReportType) => {
    setSelectedReportPeriod(reportType);
    setExportingReport(true);
    
    try {
      // First ensure we have all employees data
      const employeesData = await fetchEmployees();
      
      // Get date range based on report type
      const { startDate, endDate } = getReportDateRange(reportType);
      
      // Fetch attendance records for the specified period
      const records = await fetchAttendanceRecords(startDate, endDate);
      
      if (records.length === 0) {
        toast.error(`No attendance records found for ${reportType.toLowerCase()} report period`);
        return;
      }
      
      // Export the data to CSV with the chosen format
      exportAttendanceData(records, employeesData, reportType);
      
      toast.success(`${reportType} report generated successfully`);
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      toast.error(`Failed to generate ${reportType} report`);
    } finally {
      setExportingReport(false);
      setSelectedReportPeriod(null);
    }
  };

  // Enhanced export function with more comprehensive data
  const exportAttendanceData = (
    recordsToExport = attendanceRecords,
    employeesData = employees,
    reportType?: ReportType
  ) => {
    if (recordsToExport.length === 0) {
      toast.error('No attendance records to export');
      return;
    }
    
    // Create a lookup map for faster employee access
    const employeeMap: Record<string, Employee> = {};
    employeesData.forEach(emp => {
      if (emp.id) employeeMap[emp.id.toString()] = emp;
      if (emp._id) employeeMap[emp._id] = emp;
      if (emp.employeeId) employeeMap[emp.employeeId] = emp;
    });
    
    // Calculate attendance statistics by employee
    interface EmployeeStat {
      totalSignIns: number;
      onTime: number;
      late: number;
      totalHoursWorked: number;
      averageArrivalTime: string;
      averageDepartureTime: string;
      attendanceDates: Set<string>;
      // Track monthly attendance
      monthlyAttendance: Record<string, {
        present: number;
        late: number;
        absent: number;
        workHours: number;
      }>;
      // Track records by date for detailed view
      recordsByDate: Record<string, AttendanceRecord[]>;
    }
    
    const employeeStats: Record<string, EmployeeStat> = {};
    
    // Initialize stats for all employees
    employeesData.forEach(emp => {
      const empId = emp._id || emp.id?.toString() || emp.employeeId;
      if (empId) {
        employeeStats[empId] = {
          totalSignIns: 0,
          onTime: 0,
          late: 0,
          totalHoursWorked: 0,
          averageArrivalTime: '',
          averageDepartureTime: '',
          attendanceDates: new Set<string>(),
          monthlyAttendance: {},
          recordsByDate: {}
        };
      }
    });
    
    // Process records to calculate stats
    recordsToExport.forEach(record => {
      const empId = record.employeeId;
      if (!employeeStats[empId]) {
        // Initialize for employees not in our initial data
        employeeStats[empId] = {
          totalSignIns: 0,
          onTime: 0,
          late: 0,
          totalHoursWorked: 0,
          averageArrivalTime: '',
          averageDepartureTime: '',
          attendanceDates: new Set<string>(),
          monthlyAttendance: {},
          recordsByDate: {}
        };
      }
      
      const recordDate = new Date(record.timestamp);
      const dateStr = recordDate.toISOString().split('T')[0];
      const monthStr = dateStr.substring(0, 7); // YYYY-MM format
      
      // Track attendance dates
      employeeStats[empId].attendanceDates.add(dateStr);
      
      // Initialize recordsByDate if needed
      if (!employeeStats[empId].recordsByDate[dateStr]) {
        employeeStats[empId].recordsByDate[dateStr] = [];
      }
      
      // Add record to this date
      employeeStats[empId].recordsByDate[dateStr].push(record);
      
      // Initialize monthlyAttendance if needed
      if (!employeeStats[empId].monthlyAttendance[monthStr]) {
        employeeStats[empId].monthlyAttendance[monthStr] = {
          present: 0,
          late: 0,
          absent: 0,
          workHours: 0
        };
      }
      
      // Track sign-in/out and lateness
      if (record.type === 'sign-in') {
        employeeStats[empId].totalSignIns++;
        employeeStats[empId].monthlyAttendance[monthStr].present++;
        
        if (record.isLate) {
          employeeStats[empId].late++;
          employeeStats[empId].monthlyAttendance[monthStr].late++;
        } else {
          employeeStats[empId].onTime++;
        }
      }
    });
    
    // Choose export format based on selected format
    switch (reportFormat) {
      case ReportFormat.EMPLOYEE_SUMMARY:
        exportEmployeeSummaryReport(recordsToExport, employeeStats, employeeMap, reportType);
        break;
      case ReportFormat.MONTHLY:
        exportMonthlyReport(recordsToExport, employeeStats, employeeMap, reportType);
        break;
      case ReportFormat.DETAILED:
      default:
        exportDetailedReport(recordsToExport, employeeStats, employeeMap, reportType);
        break;
    }
  };
  
  // Export detailed report (all records)
  const exportDetailedReport = (
    recordsToExport: AttendanceRecord[],
    employeeStats: Record<string, any>,
    employeeMap: Record<string, Employee>,
    reportType?: ReportType
  ) => {
    // Comprehensive headers for the CSV
    const headers = [
      'Employee ID',
      'Employee Name',
      'Email',
      'Department',
      'Position',
      'Date',
      'Type',
      'Timestamp',
      'Status',
      'Location',
      'Notes',
      'IP Address',
      'Verification Method',
      'Face Verified',
      'Total Sign-Ins',
      'Times On Time',
      'Times Late',
      'Attendance Rate (%)',
      'Punctuality Rate (%)'
    ];
    
    // Create CSV content
    const csvRows = [headers.join(',')];
    
    // Add data for each record
    recordsToExport.forEach(record => {
      const employee = employeeMap[record.employeeId] || {
        name: record.employeeName || 'Unknown',
        email: 'unknown@example.com',
        department: 'Unknown',
        position: 'Unknown'
      };
      
      const empId = record.employeeId;
      const stats = employeeStats[empId];
      
      // Calculate rates
      const attendanceRate = stats.attendanceDates.size > 0 
        ? Math.round((stats.attendanceDates.size / 30) * 100) 
        : 0;
      
      const punctualityRate = stats.totalSignIns > 0 
        ? Math.round((stats.onTime / stats.totalSignIns) * 100) 
        : 0;
      
      // Format timestamp
      const timestamp = new Date(record.timestamp);
      const dateStr = timestamp.toISOString().split('T')[0];
      const timeStr = timestamp.toLocaleTimeString();
      
      // Process location
      let locationStr = '';
      try {
        if (record.location) {
          if (typeof record.location === 'string') {
            const locObj = JSON.parse(record.location);
            locationStr = `${locObj.latitude?.toFixed(4) || ''}, ${locObj.longitude?.toFixed(4) || ''}`;
          } else if (record.location.latitude && record.location.longitude) {
            locationStr = `${record.location.latitude.toFixed(4)}, ${record.location.longitude.toFixed(4)}`;
          }
        }
      } catch (e) {
        locationStr = 'Invalid location format';
      }
      
      // Add row to CSV
      csvRows.push([
        record.employeeId,
        employee.name,
        employee.email || 'Unknown',
        employee.department || 'Unknown',
        employee.position || 'Unknown',
        dateStr,
        record.type,
        timeStr,
        record.isLate && record.type === 'sign-in' ? 'Late' : (record.type === 'sign-in' ? 'On Time' : 'Sign Out'),
        locationStr || 'No location',
        (record.notes || '').replace(/,/g, ' '), // Remove commas to avoid CSV issues
        record.ipAddress || 'Unknown',
        record.verificationMethod || 'manual',
        record.facialVerification ? 'Yes' : 'No',
        stats.totalSignIns,
        stats.onTime,
        stats.late,
        attendanceRate,
        punctualityRate
      ].join(','));
    });
    
    downloadCsv(csvRows, reportType, 'detailed');
  };
  
  // Export employee summary report (one row per employee)
  const exportEmployeeSummaryReport = (
    recordsToExport: AttendanceRecord[],
    employeeStats: Record<string, any>,
    employeeMap: Record<string, Employee>,
    reportType?: ReportType
  ) => {
    // Headers for employee summary
    const headers = [
      'Employee ID',
      'Employee Name',
      'Email',
      'Department',
      'Position',
      'Total Days Present',
      'Total Sign-Ins',
      'Times On Time',
      'Times Late',
      'Attendance Rate (%)',
      'Punctuality Rate (%)',
      'Last Sign-In Date',
      'Last Sign-In Time',
      'Last Sign-In Status'
    ];
    
    // Create CSV content
    const csvRows = [headers.join(',')];
    
    // Process each employee
    Object.keys(employeeStats).forEach(empId => {
      const stats = employeeStats[empId];
      const employee = employeeMap[empId] || {
        name: 'Unknown Employee',
        email: 'unknown@example.com',
        department: 'Unknown',
        position: 'Unknown'
      };
      
      // Calculate rates
      const attendanceRate = stats.attendanceDates.size > 0 
        ? Math.round((stats.attendanceDates.size / 30) * 100) 
        : 0;
      
      const punctualityRate = stats.totalSignIns > 0 
        ? Math.round((stats.onTime / stats.totalSignIns) * 100) 
        : 0;
      
      // Find most recent sign-in
      let lastSignIn: AttendanceRecord | null = null;
      let lastSignInDate = '';
      let lastSignInTime = '';
      let lastSignInStatus = '';
      
      // Look through all records to find the latest sign-in
      recordsToExport.forEach(record => {
        if (record.employeeId === empId && record.type === 'sign-in') {
          if (!lastSignIn || new Date(record.timestamp) > new Date(lastSignIn.timestamp)) {
            lastSignIn = record;
          }
        }
      });
      
      // Format last sign-in info if found
      if (lastSignIn) {
        const lastTimestamp = new Date(lastSignIn.timestamp);
        lastSignInDate = lastTimestamp.toISOString().split('T')[0];
        lastSignInTime = lastTimestamp.toLocaleTimeString();
        lastSignInStatus = lastSignIn.isLate ? 'Late' : 'On Time';
      }
      
      // Add row to CSV
      csvRows.push([
        empId,
        employee.name,
        employee.email || 'Unknown',
        employee.department || 'Unknown',
        employee.position || 'Unknown',
        stats.attendanceDates.size,
        stats.totalSignIns,
        stats.onTime,
        stats.late,
        attendanceRate,
        punctualityRate,
        lastSignInDate,
        lastSignInTime,
        lastSignInStatus
      ].join(','));
    });
    
    downloadCsv(csvRows, reportType, 'employee_summary');
  };
  
  // Export monthly report (grouped by month and employee)
  const exportMonthlyReport = (
    recordsToExport: AttendanceRecord[],
    employeeStats: Record<string, any>,
    employeeMap: Record<string, Employee>,
    reportType?: ReportType
  ) => {
    // Get all months from records
    const months = new Set<string>();
    recordsToExport.forEach(record => {
      const month = new Date(record.timestamp).toISOString().substring(0, 7); // YYYY-MM
      months.add(month);
    });
    
    // Sort months
    const sortedMonths = Array.from(months).sort();
    
    // Build headers: Basic employee info + one column per month
    const baseHeaders = [
      'Employee ID',
      'Employee Name',
      'Email',
      'Department',
      'Position'
    ];
    
    // Add month columns
    sortedMonths.forEach(month => {
      baseHeaders.push(`${month} Present`);
      baseHeaders.push(`${month} Late`);
      baseHeaders.push(`${month} Attendance %`);
    });
    
    // Add total columns
    baseHeaders.push('Total Days Present');
    baseHeaders.push('Total Sign-Ins On Time');
    baseHeaders.push('Total Sign-Ins Late');
    baseHeaders.push('Overall Attendance %');
    baseHeaders.push('Overall Punctuality %');
    
    // Create CSV content
    const csvRows = [baseHeaders.join(',')];
    
    // Add a row for each employee
    Object.keys(employeeStats).forEach(empId => {
      const stats = employeeStats[empId];
      const employee = employeeMap[empId] || {
        name: 'Unknown Employee',
        email: 'unknown@example.com',
        department: 'Unknown',
        position: 'Unknown'
      };
      
      // Start with base employee info
      const row = [
        empId,
        employee.name,
        employee.email || 'Unknown',
        employee.department || 'Unknown',
        employee.position || 'Unknown'
      ];
      
      // Add data for each month
      sortedMonths.forEach(month => {
        const monthStats = stats.monthlyAttendance[month] || { present: 0, late: 0, absent: 0 };
        
        // Calculate attendance percentage for this month
        const daysInMonth = new Date(parseInt(month.substring(0, 4)), parseInt(month.substring(5, 7)), 0).getDate();
        const attendanceRate = Math.round((monthStats.present / daysInMonth) * 100);
        
        row.push(String(monthStats.present || 0)); // Present days
        row.push(String(monthStats.late || 0));    // Late days
        row.push(String(attendanceRate || 0));     // Attendance %
      });
      
      // Add totals
      const attendanceRate = stats.attendanceDates.size > 0 
        ? Math.round((stats.attendanceDates.size / 30) * 100) 
        : 0;
      
      const punctualityRate = stats.totalSignIns > 0 
        ? Math.round((stats.onTime / stats.totalSignIns) * 100) 
        : 0;
      
      row.push(String(stats.attendanceDates.size));  // Total days present
      row.push(String(stats.onTime));               // Total on time
      row.push(String(stats.late));                 // Total late
      row.push(String(attendanceRate));             // Overall attendance %
      row.push(String(punctualityRate));            // Overall punctuality %
      
      // Add row to CSV
      csvRows.push(row.join(','));
    });
    
    downloadCsv(csvRows, reportType, 'monthly');
  };
  
  // Helper to download CSV
  const downloadCsv = (
    csvRows: string[],
    reportType?: ReportType,
    formatType: string = 'default'
  ) => {
    // Create the CSV content
    const csvContent = csvRows.join('\n');
    
    // Create a download link and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Set filename based on report type and format
    const datePart = new Date().toISOString().split('T')[0];
    const reportTypeName = reportType ? `_${reportType.toLowerCase()}` : '';
    const formatName = formatType ? `_${formatType}` : '';
    
    link.setAttribute('download', `${organizationName}_attendance${reportTypeName}${formatName}_${datePart}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  Export All Data
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(ReportType).map(period => (
                <Card key={period}>
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                      <Calendar size={18} className="mr-2" />
                      {period} Report
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Attendance summary for {period.toLowerCase()} period
                    </p>
                    <Button 
                      variant="primary" 
                      className="w-full"
                      onClick={() => generateReport(period)}
                      isLoading={exportingReport && selectedReportPeriod === period}
                      leftIcon={<FileText size={16} />}
                    >
                      Generate Report
                    </Button>
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