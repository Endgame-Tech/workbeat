// Complete Improved AdminDashboard.tsx with better report structure

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardStats from './DashboardStats';
import AttendanceTable from './AttendanceTable';
import EmployeeForm from './admin/EmployeeForm';
import AnalyticsDashboard from './AnalyticsDashboard';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Layers, Settings, Calendar, Download, Users, PlusCircle, RefreshCw, FileText, BarChart3 } from 'lucide-react';
import Button from './ui/Button';
import { Employee, AttendanceRecord } from '../types';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { toast } from 'react-hot-toast';
import EmployeeTable from './admin/EmployeeTable';

enum DashboardTab {
  OVERVIEW,
  REPORTS,
  ANALYTICS,
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
  MONTHLY = 'Monthly Summary',
  TIME_GRID = 'Time Grid'
}

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

interface AdminDashboardProps {
  organizationId?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ organizationId: propOrganizationId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.OVERVIEW);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string | null>(propOrganizationId || null);
  const [organizationName, setOrganizationName] = useState<string>('Your Organization');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [exportingReport, setExportingReport] = useState<boolean>(false);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<ReportType | null>(null);
  const [reportFormat, setReportFormat] = useState<ReportFormat>(ReportFormat.EMPLOYEE_SUMMARY);
  const [gridStartDate, setGridStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [gridEndDate, setGridEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Extract organization ID and name on mount
  useEffect(() => {
    // Use prop organization ID if provided, otherwise get from service
    const orgId = propOrganizationId || employeeService.getCurrentOrganizationId();
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
  }, [propOrganizationId]);

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

  // Helper function to properly escape CSV values
  const escapeCsvValue = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return '';
    const stringValue = String(value);
    // If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Helper function to calculate working days for attendance rate calculation
  const getWorkingDaysInPeriod = (reportType?: ReportType): number => {
    if (!reportType) return 30; // Default fallback
    
    const today = new Date();
    let workingDays = 0;
    
    switch (reportType) {
      case ReportType.DAILY: {
        // For daily report, just check if today is a weekday
        const dayOfWeek = today.getDay();
        return (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1 : 0;
      }
        
      case ReportType.WEEKLY: {
        // Count working days in the last 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const day = date.getDay();
          if (day >= 1 && day <= 5) workingDays++; // Monday to Friday
        }
        return workingDays;
      }
        
      case ReportType.MONTHLY: {
        // Count working days in the last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const day = date.getDay();
          if (day >= 1 && day <= 5) workingDays++; // Monday to Friday
        }
        return workingDays;
      }
        
      default:
        return 22; // Approximate working days in a month
    }
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

  // Generate and export time grid report using date range
  const generateTimeGridReport = async () => {
    setExportingReport(true);
    
    try {
      // First ensure we have all employees data
      const employeesData = await fetchEmployees();
      
      // Convert date strings to Date objects
      const startDate = new Date(gridStartDate);
      const endDate = new Date(gridEndDate);
      
      // Validate date range
      if (startDate > endDate) {
        toast.error('Start date must be before end date');
        return;
      }
      
      // Fetch attendance records for the specified period
      const records = await fetchAttendanceRecords(startDate, endDate);
      
      if (records.length === 0) {
        toast.error(`No attendance records found for the selected date range`);
        return;
      }
      
      // Export the data to CSV with the TIME_GRID format
      exportAttendanceData(records, employeesData);
      
      toast.success(`Time grid report generated successfully`);
    } catch (error) {
      console.error(`Error generating time grid report:`, error);
      toast.error(`Failed to generate time grid report`);
    } finally {
      setExportingReport(false);
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
      case ReportFormat.TIME_GRID:
        exportTimeGridReport(recordsToExport, employeeStats, employeeMap, reportType);
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
    employeeStats: Record<string, EmployeeStat>,
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
      const workingDaysInPeriod = getWorkingDaysInPeriod(reportType);
      const attendanceRate = workingDaysInPeriod > 0 
        ? Math.round((stats.attendanceDates.size / workingDaysInPeriod) * 100) 
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
        escapeCsvValue(record.employeeId),
        escapeCsvValue(employee.name),
        escapeCsvValue(employee.email || 'Unknown'),
        escapeCsvValue(employee.department || 'Unknown'),
        escapeCsvValue(employee.position || 'Unknown'),
        escapeCsvValue(dateStr),
        escapeCsvValue(record.type),
        escapeCsvValue(timeStr),
        escapeCsvValue(record.isLate && record.type === 'sign-in' ? 'Late' : (record.type === 'sign-in' ? 'On Time' : 'Sign Out')),
        escapeCsvValue(locationStr || 'No location'),
        escapeCsvValue(
          record.isLate && record.type === 'sign-in' && record.notes 
            ? `[LATE ARRIVAL REASON] ${(record.notes || '').replace(/,/g, ' ')}` 
            : (record.notes || '').replace(/,/g, ' ')
        ), // Highlight late arrival notes
        escapeCsvValue(record.ipAddress || 'Unknown'),
        escapeCsvValue(record.verificationMethod || 'manual'),
        escapeCsvValue(record.facialVerification ? 'Yes' : 'No'),
        escapeCsvValue(stats.totalSignIns),
        escapeCsvValue(stats.onTime),
        escapeCsvValue(stats.late),
        escapeCsvValue(attendanceRate),
        escapeCsvValue(punctualityRate)
      ].join(','));
    });
    
    downloadCsv(csvRows, reportType, 'detailed');
  };
  
  // Export employee summary report (one row per employee)
  const exportEmployeeSummaryReport = (
    recordsToExport: AttendanceRecord[],
    employeeStats: Record<string, EmployeeStat>,
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
      const workingDaysInPeriod = getWorkingDaysInPeriod(reportType);
      const attendanceRate = workingDaysInPeriod > 0 
        ? Math.round((stats.attendanceDates.size / workingDaysInPeriod) * 100) 
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
        escapeCsvValue(empId),
        escapeCsvValue(employee.name),
        escapeCsvValue(employee.email || 'Unknown'),
        escapeCsvValue(employee.department || 'Unknown'),
        escapeCsvValue(employee.position || 'Unknown'),
        escapeCsvValue(stats.attendanceDates.size),
        escapeCsvValue(stats.totalSignIns),
        escapeCsvValue(stats.onTime),
        escapeCsvValue(stats.late),
        escapeCsvValue(attendanceRate),
        escapeCsvValue(punctualityRate),
        escapeCsvValue(lastSignInDate),
        escapeCsvValue(lastSignInTime),
        escapeCsvValue(lastSignInStatus)
      ].join(','));
    });
    
    downloadCsv(csvRows, reportType, 'employee_summary');
  };
  
  // Export monthly report (grouped by month and employee)
  const exportMonthlyReport = (
    recordsToExport: AttendanceRecord[],
    employeeStats: Record<string, EmployeeStat>,
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
        escapeCsvValue(empId),
        escapeCsvValue(employee.name),
        escapeCsvValue(employee.email || 'Unknown'),
        escapeCsvValue(employee.department || 'Unknown'),
        escapeCsvValue(employee.position || 'Unknown')
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
      const workingDaysInPeriod = getWorkingDaysInPeriod(reportType);
      const attendanceRate = workingDaysInPeriod > 0 
        ? Math.round((stats.attendanceDates.size / workingDaysInPeriod) * 100) 
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

  // Export time grid report (employee × day matrix with times)
  const exportTimeGridReport = (
    recordsToExport: AttendanceRecord[],
    employeeStats: Record<string, EmployeeStat>,
    employeeMap: Record<string, Employee>,
    reportType?: ReportType
  ) => {
    const startDate = new Date(gridStartDate);
    const endDate = new Date(gridEndDate);
    
    // Generate date range (only workdays, plus days with attendance)
    const dateRange: string[] = [];
    const attendanceDates = new Set<string>();
    
    // Collect all dates that have attendance
    recordsToExport.forEach(record => {
      const dateStr = new Date(record.timestamp).toISOString().split('T')[0];
      attendanceDates.add(dateStr);
    });
    
    // Generate workday dates in range, plus any attendance dates
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Include if it's a workday (Mon-Fri) OR if there's attendance on this date
      if ((dayOfWeek >= 1 && dayOfWeek <= 5) || attendanceDates.has(dateStr)) {
        dateRange.push(dateStr);
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    // Create CSV header
    const headers = ['Employee Name', 'Employee ID', ...dateRange];
    const csvRows = [headers.map(h => `"${h}"`).join(',')];
    
    // Process each employee
    Object.keys(employeeMap).forEach(empId => {
      const employee = employeeMap[empId];
      const stats = employeeStats[empId];
      
      if (!employee || !stats) return;
      
      const row = [
        escapeCsvValue(employee.name || 'Unknown'),
        escapeCsvValue(employee.employeeId || empId)
      ];
      
      // For each date in range, find attendance data
      dateRange.forEach(dateStr => {
        const dayRecords = stats.recordsByDate[dateStr] || [];
        
        if (dayRecords.length === 0) {
          row.push(''); // No attendance
          return;
        }
        
        // Find sign-in and sign-out records
        const signInRecord = dayRecords.find((r: AttendanceRecord) => r.type === 'sign-in');
        const signOutRecord = dayRecords.find((r: AttendanceRecord) => r.type === 'sign-out');
        
        let cellValue = '';
        
        if (signInRecord) {
          const signInTime = new Date(signInRecord.timestamp);
          const timeStr = signInTime.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          // Check if late (>= 09:06)
          const isLate = signInTime.getHours() > 9 || 
                        (signInTime.getHours() === 9 && signInTime.getMinutes() >= 6);
          
          cellValue = isLate ? `${timeStr}*` : timeStr; // Mark late with asterisk
        }
        
        if (signOutRecord) {
          const signOutTime = new Date(signOutRecord.timestamp);
          const timeStr = signOutTime.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          cellValue = cellValue ? `${cellValue}/${timeStr}` : `/${timeStr}`;
        }
        
        row.push(escapeCsvValue(cellValue));
      });
      
      csvRows.push(row.join(','));
    });
    
    downloadCsv(csvRows, reportType, 'time_grid');
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
          <div className="space-y-8">
            {/* Reports Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent">
                  Attendance Reports
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2">
                  Generate and export detailed attendance reports
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshAttendanceRecords}
                  isLoading={loadingAttendance}
                  leftIcon={<RefreshCw size={16} />}
                  className="rounded-xl"
                >
                  Refresh
                </Button>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Report Controls */}
            <Card variant="elevated" className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Report Configuration
                </h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="reportFormat" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Report Format
                    </label>
                    <select
                      id="reportFormat"
                      value={reportFormat}
                      onChange={(e) => setReportFormat(e.target.value as ReportFormat)}
                      className="w-full rounded-xl border-neutral-200 dark:border-neutral-700"
                    >
                      {Object.values(ReportFormat).map(format => (
                        <option key={format} value={format}>{format}</option>
                      ))}
                    </select>
                  </div>
                  
                  {reportFormat === ReportFormat.TIME_GRID && (
                    <>
                      <div>
                        <label htmlFor="gridStartDate" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          Start Date
                        </label>
                        <input
                          id="gridStartDate"
                          type="date"
                          value={gridStartDate}
                          onChange={(e) => setGridStartDate(e.target.value)}
                          className="w-full rounded-xl border-neutral-200 dark:border-neutral-700"
                        />
                      </div>
                      <div>
                        <label htmlFor="gridEndDate" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          End Date
                        </label>
                        <input
                          id="gridEndDate"
                          type="date"
                          value={gridEndDate}
                          onChange={(e) => setGridEndDate(e.target.value)}
                          className="w-full rounded-xl border-neutral-200 dark:border-neutral-700"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-end">
                    <Button 
                      variant="primary" 
                      leftIcon={<Download size={18} />}
                      onClick={() => exportAttendanceData()}
                      disabled={attendanceRecords.length === 0}
                      className="w-full rounded-xl h-12"
                    >
                      Export Report
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="autoRefresh" 
                      checked={autoRefresh} 
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-neutral-300"
                    />
                    <label htmlFor="autoRefresh" className="text-sm text-neutral-600 dark:text-neutral-300">
                      Auto-refresh data
                    </label>
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {attendanceRecords.length} records available
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Report Generation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportFormat === ReportFormat.TIME_GRID ? (
                <Card className="md:col-span-3">
                  <CardHeader className="pb-2">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                      <Calendar size={18} className="mr-2" />
                      Time Grid Report
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Generate a time grid showing employee attendance times for the selected date range.
                      Shows check-in/check-out times, excludes weekends unless attendance exists.
                      Late times ({'>'}= 09:06) are marked with asterisk (*).
                    </p>
                    <Button 
                      variant="primary" 
                      onClick={generateTimeGridReport}
                      isLoading={exportingReport}
                      leftIcon={<FileText size={16} />}
                      disabled={!gridStartDate || !gridEndDate}
                    >
                      Generate Time Grid Report
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                Object.values(ReportType).map(period => (
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
                ))
              )}
            </div>

            <AttendanceTable 
              records={attendanceRecords} 
              isAdmin={true}
              organizationId={organizationId || undefined}
              onRefresh={refreshAttendanceRecords}
              allowPagination={true}
              allowDateFilter={true}
            />
          </div>
        );
        
      case DashboardTab.ANALYTICS:
        return <AnalyticsDashboard />;
        
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
          <div className="space-y-8">
            {/* Overview Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-lg">
                  Real-time insights into your organization's attendance
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshAttendanceRecords}
                  isLoading={loadingAttendance}
                  leftIcon={<RefreshCw size={16} />}
                  className="rounded-xl"
                >
                  Refresh Data
                </Button>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              </div>
            </div>
          
            {/* Dashboard Stats */}
            <DashboardStats 
              employeeCount={employees.filter(emp => emp.isActive).length} 
              attendanceRecords={attendanceRecords}
            />
            
            {/* Recent Attendance Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    Recent Attendance
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Latest check-ins and check-outs from your team
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="autoRefreshOverview" 
                      checked={autoRefresh} 
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-neutral-300"
                    />
                    <label htmlFor="autoRefreshOverview" className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">
                      Auto-refresh
                    </label>
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    {attendanceRecords.length} total records
                  </div>
                </div>
              </div>
            
              {loadingAttendance ? (
                <Card variant="elevated">
                  <CardContent className="py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
                      <p className="text-neutral-600 dark:text-neutral-300 font-medium">Loading attendance records...</p>
                    </div>
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
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Modern Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              {/* Organization Info Card */}
              <Card variant="glass" className="border-primary-200 dark:border-primary-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                      {organizationName}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Admin Dashboard
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Card */}
              <Card variant="elevated" className="overflow-hidden">
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <Button
                      variant={activeTab === DashboardTab.OVERVIEW ? 'primary' : 'ghost'}
                      onClick={() => setActiveTab(DashboardTab.OVERVIEW)}
                      leftIcon={<Layers size={20} />}
                      className="w-full justify-start h-12 rounded-xl font-medium"
                      size="lg"
                    >
                      Overview & Analytics
                    </Button>

                    <Button
                      variant={activeTab === DashboardTab.REPORTS ? 'primary' : 'ghost'}
                      onClick={() => setActiveTab(DashboardTab.REPORTS)}
                      leftIcon={<FileText size={20} />}
                      className="w-full justify-start h-12 rounded-xl font-medium"
                      size="lg"
                    >
                      Reports & Data
                    </Button>

                    <Button
                      variant={activeTab === DashboardTab.ANALYTICS ? 'primary' : 'ghost'}
                      onClick={() => setActiveTab(DashboardTab.ANALYTICS)}
                      leftIcon={<BarChart3 size={20} />}
                      className="w-full justify-start h-12 rounded-xl font-medium"
                      size="lg"
                    >
                      Advanced Analytics
                    </Button>

                    <Button
                      variant={activeTab === DashboardTab.WORKERS ? 'primary' : 'ghost'}
                      onClick={() => setActiveTab(DashboardTab.WORKERS)}
                      leftIcon={<Users size={20} />}
                      className="w-full justify-start h-12 rounded-xl font-medium"
                      size="lg"
                    >
                      Employee Management
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                    Quick Actions
                  </h3>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      leftIcon={<RefreshCw size={18} />} 
                      onClick={refreshAttendanceRecords}
                      isLoading={loadingAttendance}
                      className="w-full justify-start h-10 rounded-lg"
                    >
                      Refresh Data
                    </Button>
                    <Button 
                      variant="ghost" 
                      leftIcon={<Download size={18} />} 
                      onClick={() => exportAttendanceData()}
                      disabled={attendanceRecords.length === 0}
                      className="w-full justify-start h-10 rounded-lg"
                    >
                      Export Report
                    </Button>
                    <Button 
                      variant="ghost" 
                      leftIcon={<Settings size={18} />} 
                      onClick={() => {
                        // Try multiple ways to get the organization ID
                        let orgId = organizationId;
                        
                        if (!orgId) {
                          // Try to get it directly from localStorage
                          try {
                            const userString = localStorage.getItem('user');
                            if (userString) {
                              const userData = JSON.parse(userString);
                              orgId = userData.organizationId || userData.organization?.id;
                            }
                          } catch (err) {
                            console.error('Error getting org ID from localStorage:', err);
                          }
                        }
                        
                        if (!orgId) {
                          // Try organization localStorage entry
                          try {
                            const orgString = localStorage.getItem('organization');
                            if (orgString) {
                              const orgData = JSON.parse(orgString);
                              orgId = orgData.id;
                            }
                          } catch (err) {
                            console.error('Error getting org ID from organization localStorage:', err);
                          }
                        }
                        
                        if (orgId) {
                          navigate(`/organization/${orgId}/settings`);
                        } else {
                          toast.error('Organization ID not found. Please try refreshing the page.');
                          console.error('Organization ID not available. Current organizationId state:', organizationId);
                        }
                      }}
                      className="w-full justify-start h-10 rounded-lg"
                    >
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Status Indicator */}
              <Card variant="glass" className="border-success-200 dark:border-success-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-success-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-success-700 dark:text-success-300">
                        System Online
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;