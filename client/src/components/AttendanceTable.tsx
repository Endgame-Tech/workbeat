// Updated AttendanceTable.tsx with improved UI arrangement for icons
import React, { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, Employee } from '../types';

// Define AttendanceUpdate type if not already imported
type AttendanceUpdate = {
  _id?: string;
  employeeId: string | number;
  employeeName?: string;
  type: 'sign-in' | 'sign-out';
  timestamp: string | Date;
  isLate?: boolean;
  location?: { latitude: number; longitude: number } | string;
  organizationId?: string;
  verificationMethod?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  facialCapture?: {
    image?: string;
    isLive?: boolean;
  };
  notes?: string;
  ipAddress?: string;
};
import { formatTime, formatDate } from '../utils/attendanceUtils';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Clock, MapPin, ArrowDown, ArrowUp, Search, RefreshCw, Filter, Calendar, ChevronDown, Download, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { exportService } from '../services/exportService';
import { toast } from 'react-hot-toast';
import Badge from './ui/Badge';
import EmployeeStatsModal from './EmployeeStatsModal';
import { useWebSocket } from './context/WebSocketProvider';

interface AttendanceTableProps {
  records?: AttendanceRecord[];
  isAdmin?: boolean;
  organizationId?: string; // Optional prop to override the organization ID
  onRefresh?: () => void; // Optional callback for when the refresh button is clicked
  allowPagination?: boolean; // Enable load more functionality
  allowDateFilter?: boolean; // Enable date range filtering
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records: initialRecords,
  isAdmin = false,
  organizationId: propOrgId,
  onRefresh,
  allowPagination = false,
  allowDateFilter = false
}) => {
  const { 
    isConnected,  
    onAttendanceUpdate 
  } = useWebSocket();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'timestamp' | 'employeeId'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'sign-in' | 'sign-out'>('all');
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords || []);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});
  const [loading, setLoading] = useState(!initialRecords);
  const [refreshing, setRefreshing] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(propOrgId || null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [newRecordAlert, setNewRecordAlert] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreRecords, setHasMoreRecords] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const recordsPerPage = 30;

  // Date filtering state
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Employee stats modal state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeStats, setShowEmployeeStats] = useState(false);

  // Get the organization ID on mount if not provided as a prop
  useEffect(() => {
    if (!organizationId) {
      const orgId = employeeService.getCurrentOrganizationId();
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
    }
  }, [organizationId, propOrgId]);

  // Update records when initialRecords prop changes
  useEffect(() => {
    if (initialRecords) {
      setRecords(initialRecords);
      setLoading(false);
    }
  }, [initialRecords]);


  useEffect(() => {
    if (!isConnected) return;

    // Accept real-time attendance update, map to AttendanceRecord
    const handleAttendanceUpdate = (attendanceData: AttendanceUpdate) => {
      // Map AttendanceUpdate to AttendanceRecord
      const attendanceRecord: AttendanceRecord = {
        _id: attendanceData._id ? attendanceData._id.toString() : '',
        employeeId: attendanceData.employeeId !== undefined ? String(attendanceData.employeeId) : '',
        employeeName: attendanceData.employeeName ?? '',
        type: attendanceData.type,
        timestamp: attendanceData.timestamp
          ? (attendanceData.timestamp instanceof Date
              ? attendanceData.timestamp
              : new Date(attendanceData.timestamp))
          : new Date(),
        notes: attendanceData.notes ?? '',
        ipAddress: attendanceData.ipAddress ?? '',
        isLate: attendanceData.isLate,
        location: (() => {
          if (!attendanceData.location) return undefined;
          if (typeof attendanceData.location === 'string') {
            try {
              const loc = JSON.parse(attendanceData.location);
              // Only keep latitude and longitude, ignore extra fields
              if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
                return { latitude: loc.latitude, longitude: loc.longitude };
              }
              return undefined;
            } catch {
              return undefined;
            }
          }
          if (typeof attendanceData.location === 'object' && attendanceData.location !== null) {
            // Only keep latitude and longitude, ignore extra fields
            const { latitude, longitude } = attendanceData.location;
            if (typeof latitude === 'number' && typeof longitude === 'number') {
              return { latitude, longitude };
            }
          }
          return undefined;
        })(),
        organizationId: attendanceData.organizationId ?? '',
        verificationMethod: (
          attendanceData.verificationMethod === 'face-recognition' ||
          attendanceData.verificationMethod === 'fingerprint' ||
          attendanceData.verificationMethod === 'manual' ||
          attendanceData.verificationMethod === 'qr-code' ||
          attendanceData.verificationMethod === 'nfc'
        ) ? attendanceData.verificationMethod : undefined,
        facialCapture: attendanceData.facialCapture && typeof attendanceData.facialCapture.image === 'string'
          ? {
              image: attendanceData.facialCapture.image,
              // Optionally map confidence and quality if available in attendanceData
              confidence: (attendanceData.facialCapture as { confidence?: number }).confidence,
              quality: (() => {
                const q = (attendanceData.facialCapture as { quality?: number }).quality;
                if (typeof q === 'number') {
                  if (q >= 0 && q < 0.4) return 'low';
                  if (q >= 0.4 && q < 0.7) return 'medium';
                  if (q >= 0.7) return 'high';
                }
                return undefined;
              })(),
            }
          : undefined,
        createdAt: attendanceData.createdAt ? new Date(attendanceData.createdAt) : new Date(),
        updatedAt: attendanceData.updatedAt ? new Date(attendanceData.updatedAt) : new Date(),
        // Add any other AttendanceRecord fields with sensible defaults if needed
      };

      // Show notification for new attendance record
      const employeeName = attendanceRecord.employeeName || 'Employee';
      const action = attendanceRecord.type === 'sign-in' ? 'checked in' : 'checked out';
      const message = `${employeeName} ${action}${attendanceRecord.isLate ? ' (Late)' : ''}`;

      setNewRecordAlert(message);
      setTimeout(() => setNewRecordAlert(null), 5000);

      if (String(attendanceRecord.organizationId) === String(organizationId)) {
        setRecords(prev => [attendanceRecord, ...prev]);
      }
    };

    // Subscribe to real-time updates with correct type
    const unsubscribe = onAttendanceUpdate(handleAttendanceUpdate);

    return () => {
      unsubscribe();
    };
  }, [isConnected, onAttendanceUpdate, organizationId]);

  // Function to fetch attendance records for the current organization
  const fetchAttendanceRecords = useCallback(async (loadMore = false, filterStartDate?: string, filterEndDate?: string) => {
    if (!organizationId) {
      console.warn('Cannot fetch attendance records: No organization ID available');
      return;
    }

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentPage(1);
    }

    try {
      let data: AttendanceRecord[] = [];

      if (allowPagination && !initialRecords) {
        // Use pagination if enabled and not using initial records

        if (filterStartDate && filterEndDate) {
          // Use date-filtered API call
          data = await attendanceService.getAttendanceReport(filterStartDate, filterEndDate);
        } else {
          // Use regular paginated API call
          data = await attendanceService.getAllAttendanceRecords(recordsPerPage);
        }

        if (loadMore) {
          // Append new records to existing ones
          setRecords(prev => [...prev, ...data]);
          setCurrentPage(prev => prev + 1);
        } else {
          // Replace records
          setRecords(data);
        }

        // Check if there are more records
        setHasMoreRecords(data.length === recordsPerPage);
      } else {
        // Regular fetch without pagination
        if (filterStartDate && filterEndDate) {
          data = await attendanceService.getAttendanceReport(filterStartDate, filterEndDate);
        } else {
          data = await attendanceService.getAllAttendanceRecords(100);
        }
        console.log('Received attendance data:', {
          count: data.length,
          organizationId: organizationId,
          sampleRecord: data[0] ? {
            id: data[0]._id,
            employeeId: data[0].employeeId,
            organizationId: data[0].organizationId,
            type: data[0].type,
            timestamp: data[0].timestamp
          } : null
        });
        setRecords(data);
      }

      console.log(`Fetched ${data.length} attendance records for organization ${organizationId}`);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      // Don't show toast for data loading errors - let the UI handle empty states gracefully
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [organizationId, allowPagination, initialRecords, currentPage, recordsPerPage, dateFilterEnabled, startDate, endDate]);

  // Function to fetch employees for the current organization
  const fetchEmployees = useCallback(async () => {
    if (!organizationId) {
      console.warn('Cannot fetch employees: No organization ID available');
      return;
    }

    try {
      const data = await employeeService.getAllEmployees();

      // Transform into a lookup map for easier access by ID
      const employeeMap: Record<string, Employee> = {};
      interface EmployeeMap {
        [key: string]: Employee;
      }

      data.forEach((employee: Employee) => {
        // Map by all possible ID forms for better matching
        if (employee.id) (employeeMap as EmployeeMap)[String(employee.id)] = employee;
        if (employee._id) (employeeMap as EmployeeMap)[employee._id] = employee;
        if (employee.employeeId) (employeeMap as EmployeeMap)[employee.employeeId] = employee;
      });

      console.log(`Loaded ${data.length} employees for organization ${organizationId}`);
      setEmployees(employeeMap);
    } catch (err) {
      console.error('Error fetching employees:', err);
      // Don't show toast for data loading errors - log for debugging only
    }
  }, [organizationId]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    setRefreshing(true);

    // If parent component provided an onRefresh callback, use it
    if (onRefresh) {
      onRefresh();
      setTimeout(() => setRefreshing(false), 500); // ensure the refresh icon spins for at least 500ms
    } else {
      // Otherwise, do our own refresh
      const filterStart = dateFilterEnabled ? startDate : undefined;
      const filterEnd = dateFilterEnabled ? endDate : undefined;
      fetchAttendanceRecords(false, filterStart, filterEnd);
      fetchEmployees();
    }
  }, [onRefresh, dateFilterEnabled, startDate, endDate, fetchAttendanceRecords, fetchEmployees]);

  // Export functions
  const handleExportCSV = async () => {
    try {
      const dateRange = dateFilterEnabled && startDate && endDate
        ? { start: startDate, end: endDate }
        : undefined;

      await exportService.exportAttendanceToCSV(filteredRecords, dateRange);
      toast.success('Attendance records exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export attendance records to CSV');
    }
  };

  const handleExportExcel = async () => {
    try {
      const dateRange = dateFilterEnabled && startDate && endDate
        ? { start: startDate, end: endDate }
        : undefined;

      await exportService.exportAttendanceToExcel(filteredRecords, dateRange);
      toast.success('Attendance records exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export attendance records to Excel');
    }
  };

  const handleExportPDF = async () => {
    try {
      const dateRange = dateFilterEnabled && startDate && endDate
        ? { start: startDate, end: endDate }
        : undefined;

      await exportService.exportAttendanceToPDF(filteredRecords, dateRange);
      toast.success('Attendance records exported to PDF successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export attendance records to PDF');
    }
  };

  // Load more records function
  const handleLoadMore = () => {
    const filterStart = dateFilterEnabled ? startDate : undefined;
    const filterEnd = dateFilterEnabled ? endDate : undefined;
    fetchAttendanceRecords(true, filterStart, filterEnd);
  };

  // Handle date filter changes
  const handleDateFilterApply = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setDateFilterEnabled(true);
    fetchAttendanceRecords(false, startDate, endDate);
    setShowDateFilter(false);
  };

  // Clear date filter
  const handleDateFilterClear = () => {
    setDateFilterEnabled(false);
    setStartDate('');
    setEndDate('');
    fetchAttendanceRecords(false);
    setShowDateFilter(false);
  };

  // Quick date filter presets
  const handleQuickDateFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setDateFilterEnabled(true);
    fetchAttendanceRecords(false, start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
    setShowDateFilter(false);
  };

  // Handle employee click to show stats
  const handleEmployeeClick = (employeeId: string) => {
    const employee = employees[employeeId];
    if (employee) {
      setSelectedEmployee(employee);
      setShowEmployeeStats(true);
    }
  };

  // Sort and filter records
  const filteredRecords = records
    .filter(record => {
      // Filter by organization ID (extra check in case records from multiple orgs were provided)
      if (organizationId && record.organizationId && String(record.organizationId) !== String(organizationId)) {
        return false;
      }

      // Filter by type
      if (filter !== 'all' && record.type !== filter) {
        return false;
      }

      // Filter by search term
      if (searchTerm === '') {
        return true;
      }

      const employee = employees[record.employeeId];

      return employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             employee?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (record.employeeName && record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .sort((a, b) => {
      if (sortField === 'timestamp') {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      } else {
        return sortDirection === 'asc'
          ? String(a.employeeId).localeCompare(String(b.employeeId))
          : String(b.employeeId).localeCompare(String(a.employeeId));
      }
    });

  const handleSort = (field: 'timestamp' | 'employeeId') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getEmployeeName = (employeeId: string, recordEmployeeName?: string): string => {
    // First use the employee data from our map if available
    if (employees[employeeId]?.name) {
      return employees[employeeId].name;
    }

    // If not available, use the employee name stored in the record
    if (recordEmployeeName) {
      return recordEmployeeName;
    }

    // Fallback
    return 'Unknown Employee';
  };

  // Fixed function to never show "Unknown Department"
  const getEmployeeDepartment = (employeeId: string): string => {
    return employees[employeeId]?.department || '';
  };

  // Helper to extract image from different possible sources
  const getEmployeeImage = (record: AttendanceRecord): string | null => {
    // First priority: Check facial capture from the record
    if (record.facialCapture && record.facialCapture.image) {
      return record.facialCapture.image;
    }

    // Second priority: Get employee from the map and check for face recognition images
    const employee = employees[record.employeeId];
    if (employee) {
      // Check for faceRecognition field
      if (employee.faceRecognition) {
        // Handle string or object format
        const faceData = typeof employee.faceRecognition === 'string'
          ? JSON.parse(employee.faceRecognition)
          : employee.faceRecognition;

        if (faceData.faceImages && faceData.faceImages.length > 0) {
          return faceData.faceImages[0];
        }
      }

      // Check for profile image
      if (employee.profileImage) {
        return employee.profileImage;
      }
    }

    return null;
  };

  // Get badge type based on attendance status
  const getStatusBadgeType = (record: AttendanceRecord): 'primary' | 'success' | 'warning' => {
    if (record.type === 'sign-in') {
      return record.isLate ? 'warning' : 'success';
    }
    return 'primary';
  };

  const getStatusText = (record: AttendanceRecord): string => {
    if (record.type === 'sign-in') {
      return record.isLate ? 'Late Arrival' : 'On Time';
    }
    return 'Sign Out';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading attendance records...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
      <CardHeader className="space-y-4">
        {/* Header with Title and Refresh */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mr-2">
              Attendance Records
            </h2>
            {organizationName && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {organizationName}
              </span>
            )}
            
            {/* WebSocket Connection Status */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ml-3 ${
              isConnected
                ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300'
                : 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Offline</span>
                </>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              isLoading={refreshing}
              className="rounded-full p-1 ml-2"
              title="Refresh attendance records"
            >
              <RefreshCw size={16} />
            </Button>
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-auto">
            <Input
              placeholder="Search employee or department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              className="w-full sm:w-64"
            />
          </div>
        </div>

        {/* New Record Alert */}
        {newRecordAlert && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center space-x-2 animate-pulse">
            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              {newRecordAlert}
            </span>
            <button 
              onClick={() => setNewRecordAlert(null)}
              className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              ×
            </button>
          </div>
        )}

        {/* Filters and Controls Row */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}
              >
                All
              </Button>
              <Button
                variant={filter === 'sign-in' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('sign-in')}
                className={filter === 'sign-in' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}
              >
                Sign In
              </Button>
              <Button
                variant={filter === 'sign-out' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('sign-out')}
                className={filter === 'sign-out' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'}
              >
                Sign Out
              </Button>
            </div>

            {/* Date Filter */}
            {allowDateFilter && (
              <div className="relative">
                <Button
                  variant={dateFilterEnabled ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className="flex items-center gap-2 border border-gray-200 dark:border-gray-700"
                >
                  <Calendar size={16} />
                  Date Filter
                  <ChevronDown size={14} className={`transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
                </Button>

                {showDateFilter && (
                  <div className="absolute left-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80 z-50">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Filters</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleQuickDateFilter(7)}>
                            Last 7 days
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleQuickDateFilter(30)}>
                            Last 30 days
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleQuickDateFilter(90)}>
                            Last 90 days
                          </Button>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Range</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                            <Input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                            <Input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={handleDateFilterApply}
                              className="flex-1"
                            >
                              Apply Filter
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleDateFilterClear}
                              className="flex-1"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Export:</span>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-2 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                title="Export to CSV"
              >
                <Download size={14} />
                CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportExcel}
                className="flex items-center gap-2 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                title="Export to Excel"
              >
                <Download size={14} />
                Excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportPDF}
                className="flex items-center gap-2 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                title="Export to PDF"
              >
                <Download size={14} />
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Active Date Filter Indicator */}
        {dateFilterEnabled && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Filter size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Showing records from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDateFilterClear}
              className="ml-auto text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              Clear filter
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('employeeId')}>
                  <div className="flex items-center">
                    Employee
                    {sortField === 'employeeId' && (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('timestamp')}>
                  <div className="flex items-center">
                    Timestamp
                    {sortField === 'timestamp' && (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP Address
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                    <td
                      className="px-4 py-4 whitespace-nowrap cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-l-lg"
                      onClick={() => handleEmployeeClick(record.employeeId)}
                      title="Click to view employee statistics"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 relative">
                          {(() => {
                            const imageUrl = getEmployeeImage(record);

                            if (imageUrl) {
                              return (
                                <img
                                  src={imageUrl}
                                  alt={getEmployeeName(record.employeeId, record.employeeName)}
                                  className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallbackDiv = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                                    if (fallbackDiv) {
                                      fallbackDiv.classList.remove('hidden');
                                    }
                                  }}
                                />
                              );
                            }
                            return null;
                          })()}

                          {/* Fallback initials if no image is available or loading fails */}
                          <div className={`h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium ${
                            getEmployeeImage(record) ? 'hidden' : ''
                          } fallback-initials`}>
                            {getEmployeeName(record.employeeId, record.employeeName)
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                          {'isLive' in (record.facialCapture || {}) && (record.facialCapture as { isLive?: boolean })?.isLive && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-1 border-2 border-white dark:border-gray-800" title="Live Capture">
                              <CheckCircle size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getEmployeeName(record.employeeId, record.employeeName)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getEmployeeDepartment(record.employeeId) || <span className="text-gray-400 italic">N/A</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center"> {/* Changed to flex items-center */}
                        <Clock size={14} className="mr-2 text-gray-500 dark:text-gray-400" />
                        <div className="flex flex-col"> {/* Added flex-col for stacking time and date */}
                            <span className="text-sm text-gray-900 dark:text-white">{formatTime(record.timestamp)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(record.timestamp)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge
                        type={getStatusBadgeType(record)}
                        text={getStatusText(record)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      {record.location ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-start">
                          <MapPin size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                          <span className="break-all">
                            {typeof record.location === 'string'
                              ? (() => {
                                  try {
                                    const loc = JSON.parse(record.location);
                                    return `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
                                  } catch (error) {
                                    console.error('Error parsing location:', error);
                                    return record.location;
                                  }
                                })()
                              : record.location.latitude && record.location.longitude
                                ? `${record.location.latitude.toFixed(4)}, ${record.location.longitude.toFixed(4)}`
                                : 'Invalid location'
                            }
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No location</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {record.notes || <span className="text-gray-400 italic">-</span>}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.ipAddress || <span className="text-gray-400 italic">Unknown</span>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Search size={24} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          No attendance records found
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {allowPagination && hasMoreRecords && filteredRecords.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30">
            <div className="text-center space-y-3">
              <Button
                variant="primary"
                onClick={handleLoadMore}
                isLoading={loadingMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
              >
                {loadingMore ? 'Loading more records...' : 'Load More Records'}
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {filteredRecords.length} records • Click to load more
              </p>
            </div>
          </div>
        )}

        {/* No more records indicator */}
        {allowPagination && !hasMoreRecords && filteredRecords.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <div className="text-center flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-green-700 dark:text-green-300" />
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                All records loaded ({filteredRecords.length} total)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Employee Stats Modal */}
    {selectedEmployee && (
      <EmployeeStatsModal
        employee={selectedEmployee}
        isOpen={showEmployeeStats}
        onClose={() => {
          setShowEmployeeStats(false);
          setSelectedEmployee(null);
        }}
      />
    )}
  </>
  );
};

export default AttendanceTable;