import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AttendanceTable from '../AttendanceTable';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Calendar, Download, RefreshCw, FileText } from 'lucide-react';
import Button from '../ui/Button';
import { AttendanceRecord, Employee } from '../../types';
import { employeeService } from '../../services/employeeService';
import { attendanceService } from '../../services/attendanceService';
import { toast } from 'react-hot-toast';

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
}

const OrganizationReports: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [organizationName, setOrganizationName] = useState<string>('Your Organization');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [exportingReport, setExportingReport] = useState<boolean>(false);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<ReportType | null>(null);

  // Report format and custom date range state
  const [reportFormat, setReportFormat] = useState<ReportFormat>(ReportFormat.EMPLOYEE_SUMMARY);
  const [gridStartDate, setGridStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [gridEndDate, setGridEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // --- EmployeeStat computation ---
  const computeEmployeeStats = useCallback((): Record<string, EmployeeStat> => {
    const stats: Record<string, EmployeeStat> = {};
    const recordsByEmployee: Record<string, AttendanceRecord[]> = {};
    attendanceRecords.forEach(record => {
      if (!recordsByEmployee[record.employeeId]) recordsByEmployee[record.employeeId] = [];
      recordsByEmployee[record.employeeId].push(record);
    });
    Object.entries(recordsByEmployee).forEach(([employeeId, records]) => {
      let totalSignIns = 0;
      let onTime = 0;
      let late = 0;
      let totalHoursWorked = 0;
      const arrivalTimes: number[] = [];
      const departureTimes: number[] = [];
      const attendanceDates = new Set<string>();
      // Group by date
      const recordsByDate: Record<string, AttendanceRecord[]> = {};
      records.forEach(r => {
        const dateStr = new Date(r.timestamp).toISOString().split('T')[0];
        attendanceDates.add(dateStr);
        if (!recordsByDate[dateStr]) recordsByDate[dateStr] = [];
        recordsByDate[dateStr].push(r);
      });
      // For each date, find sign-in and sign-out
      Object.values(recordsByDate).forEach(dayRecords => {
        const signIn = dayRecords.find(r => r.type === 'sign-in');
        const signOut = dayRecords.find(r => r.type === 'sign-out');
        if (signIn) {
          totalSignIns++;
          if (signIn.isLate) late++;
          else onTime++;
          arrivalTimes.push(new Date(signIn.timestamp).getTime());
        }
        if (signOut) {
          departureTimes.push(new Date(signOut.timestamp).getTime());
        }
        if (signIn && signOut) {
          const hours = (new Date(signOut.timestamp).getTime() - new Date(signIn.timestamp).getTime()) / (1000 * 60 * 60);
          if (hours > 0 && hours < 24) totalHoursWorked += hours;
        }
      });
      const avg = (arr: number[]) => arr.length ? new Date(Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)).toLocaleTimeString() : '-';
      stats[employeeId] = {
        totalSignIns,
        onTime,
        late,
        totalHoursWorked: Number(totalHoursWorked.toFixed(2)),
        averageArrivalTime: avg(arrivalTimes),
        averageDepartureTime: avg(departureTimes),
        attendanceDates
      };
    });
    return stats;
  }, [attendanceRecords]);

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
  const fetchAttendanceRecords = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!organizationId) {
      console.warn('Cannot fetch attendance records: Missing organization ID');
      return [];
    }
    
    setLoadingAttendance(true);
    try {
      
      // If dates are provided, use them for filtering
      let records;
      if (startDate && endDate) {
        
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
    
    try {
      const data = await employeeService.getAllEmployees();
      
      setEmployees(data || []);
      return data || [];
    } catch (err) {
      console.error('Error in fetch operation:', err);
      toast.error('Failed to load employees');
      setEmployees([]);
      return [];
    }
  }, [organizationId]);

  // Fetch employees and attendance data on mount
  useEffect(() => {
    if (organizationId) {
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
      fetchAttendanceRecords();
    }, 30000); // 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [autoRefresh, fetchAttendanceRecords]);

  // Manual refresh function for attendance records
  const refreshAttendanceRecords = () => {
    fetchAttendanceRecords();
    toast.success('Refreshing attendance records...');
  };

  // Get date range for report types
  const getReportDateRange = (reportType: ReportType): { startDate: Date, endDate: Date } => {
    const endDate = new Date(); // Today
    endDate.setHours(23, 59, 59, 999); // End of today
    
    const startDate = new Date();
    
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

  // Helper to download CSV
  const downloadCsv = (
    csvRows: string[],
    reportType?: ReportType,
    formatType: string = 'default'
  ) => {
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const datePart = new Date().toISOString().split('T')[0];
    const reportTypeName = reportType ? `_${reportType.toLowerCase()}` : '';
    const formatName = formatType ? `_${formatType}` : '';
    link.setAttribute('download', `${organizationName}_attendance${reportTypeName}${formatName}_${datePart}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export employee summary stats as CSV
  const exportEmployeeStats = () => {
    const stats = computeEmployeeStats();
    const headers = [
      'Employee ID',
      'Employee Name',
      'Total Sign-Ins',
      'On Time',
      'Late',
      'Total Hours Worked',
      'Average Arrival Time',
      'Average Departure Time',
      'Attendance Days'
    ];
    const csvRows = [headers.join(',')];
    Object.entries(stats).forEach(([employeeId, stat]) => {
      const emp = employees.find(e => e.employeeId === employeeId || e._id === employeeId || e.id?.toString() === employeeId);
      csvRows.push([
        employeeId,
        emp?.name || '-',
        stat.totalSignIns,
        stat.onTime,
        stat.late,
        stat.totalHoursWorked,
        stat.averageArrivalTime,
        stat.averageDepartureTime,
        stat.attendanceDates.size
      ].map(escapeCsvValue).join(','));
    });
    downloadCsv(csvRows, undefined, 'employee_summary');
    toast.success('Employee summary exported');
  };

  // Generate basic attendance report
  const exportAttendanceData = (
    recordsToExport = attendanceRecords,
    employeesData = employees
  ) => {
    if (recordsToExport.length === 0) {
      toast.error('No attendance records to export');
      return;
    }
    
    // Comprehensive headers for the CSV
    const headers = [
      'Employee ID',
      'Employee Name',
      'Date',
      'Type',
      'Timestamp',
      'Status',
      'Notes'
    ];
    
    // Create CSV content
    const csvRows = [headers.join(',')];
    
    // Create a lookup map for faster employee access
    const employeeMap: Record<string, Employee> = {};
    employeesData.forEach(emp => {
      if (emp.id) employeeMap[emp.id.toString()] = emp;
      if (emp._id) employeeMap[emp._id] = emp;
      if (emp.employeeId) employeeMap[emp.employeeId] = emp;
    });
    
    // Add data for each record
    recordsToExport.forEach(record => {
      const employee = employeeMap[record.employeeId] || {
        name: record.employeeName || 'Unknown',
        email: 'unknown@example.com'
      };
      
      // Format timestamp
      const timestamp = new Date(record.timestamp);
      const dateStr = timestamp.toISOString().split('T')[0];
      const timeStr = timestamp.toLocaleTimeString();
      
      // Add row to CSV
      csvRows.push([
        escapeCsvValue(record.employeeId),
        escapeCsvValue(employee.name),
        escapeCsvValue(dateStr),
        escapeCsvValue(record.type),
        escapeCsvValue(timeStr),
        escapeCsvValue(record.isLate && record.type === 'sign-in' ? 'Late' : (record.type === 'sign-in' ? 'On Time' : 'Sign Out')),
        escapeCsvValue((record.notes || '').replace(/,/g, ' '))
      ].join(','));
    });
    
    downloadCsv(csvRows, undefined, 'detailed');
  };

  // Generate and export attendance report with support for custom format and date range
  const generateReport = async (reportType: ReportType, customFormat?: ReportFormat, customStart?: string, customEnd?: string) => {
    setSelectedReportPeriod(reportType);
    setExportingReport(true);
    try {
      // First ensure we have all employees data
      const employeesData = await fetchEmployees();
      // Use custom date range if provided, else use preset
      let startDate: Date, endDate: Date;
      if (customStart && customEnd) {
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      } else {
        ({ startDate, endDate } = getReportDateRange(reportType));
      }
      // Fetch attendance records for the specified period
      const records = await fetchAttendanceRecords(startDate, endDate);
      if (records.length === 0) {
        toast.error(`No attendance records found for ${reportType.toLowerCase()} report period`);
        return;
      }
      // Export based on selected format
      if ((customFormat || reportFormat) === ReportFormat.EMPLOYEE_SUMMARY) {
        // Use only records in range for summary
        const prevRecords = attendanceRecords;
        setAttendanceRecords(records); // temporarily set for summary export
        exportEmployeeStats();
        setAttendanceRecords(prevRecords); // restore
      } else {
        exportAttendanceData(records, employeesData);
      }
      toast.success(`${reportType} report generated successfully`);
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error);
      toast.error(`Failed to generate ${reportType} report`);
    } finally {
      setExportingReport(false);
      setSelectedReportPeriod(null);
    }
  };

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


      {/* Report Controls: Format and Date Range */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Export/Generate Report
          </h3>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {attendanceRecords.length} records available
              </div>
              <Button 
                variant="primary" 
                leftIcon={<Download size={18} />}
                onClick={() => exportAttendanceData()}
                disabled={attendanceRecords.length === 0}
                className="rounded-xl"
              >
                Export Current Data
              </Button>
            </div>
          </div>
          {/* Report format and date range controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="reportFormat" className="text-sm font-medium">Report Format:</label>
              <select
                id="reportFormat"
                value={reportFormat}
                onChange={e => setReportFormat(e.target.value as ReportFormat)}
                className="border rounded px-2 py-1 text-sm"
              >
                {Object.values(ReportFormat).map(fmt => (
                  <option key={fmt} value={fmt}>{fmt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="gridStartDate" className="text-sm font-medium">Start Date:</label>
              <input
                id="gridStartDate"
                type="date"
                value={gridStartDate}
                onChange={e => setGridStartDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                max={gridEndDate}
              />
              <label htmlFor="gridEndDate" className="text-sm font-medium">End Date:</label>
              <input
                id="gridEndDate"
                type="date"
                value={gridEndDate}
                onChange={e => setGridEndDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                min={gridStartDate}
                max={new Date().toISOString().split('T')[0]}
              />
              <Button
                variant="primary"
                leftIcon={<FileText size={16} />}
                onClick={() => generateReport(ReportType.MONTHLY, reportFormat, gridStartDate, gridEndDate)}
                isLoading={exportingReport && selectedReportPeriod === ReportType.MONTHLY}
                className="rounded-xl"
              >
                Generate Custom Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Summary Table and Export */}
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 flex flex-row items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Employee Attendance Summary
          </h3>
          <Button 
            variant="primary"
            leftIcon={<Download size={16} />}
            onClick={exportEmployeeStats}
            className="rounded-xl"
          >
            Export Summary
          </Button>
        </CardHeader>
        <CardContent className="p-6 overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800">
                <th className="px-2 py-1 border">Employee</th>
                <th className="px-2 py-1 border">Sign-Ins</th>
                <th className="px-2 py-1 border">On Time</th>
                <th className="px-2 py-1 border">Late</th>
                <th className="px-2 py-1 border">Total Hours</th>
                <th className="px-2 py-1 border">Avg Arrival</th>
                <th className="px-2 py-1 border">Avg Departure</th>
                <th className="px-2 py-1 border">Days Present</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(computeEmployeeStats()).map(([employeeId, stat]) => {
                const emp = employees.find(e => e.employeeId === employeeId || e._id === employeeId || e.id?.toString() === employeeId);
                return (
                  <tr key={employeeId}>
                    <td className="px-2 py-1 border">{emp?.name || employeeId}</td>
                    <td className="px-2 py-1 border text-center">{stat.totalSignIns}</td>
                    <td className="px-2 py-1 border text-center">{stat.onTime}</td>
                    <td className="px-2 py-1 border text-center">{stat.late}</td>
                    <td className="px-2 py-1 border text-center">{stat.totalHoursWorked}</td>
                    <td className="px-2 py-1 border text-center">{stat.averageArrivalTime}</td>
                    <td className="px-2 py-1 border text-center">{stat.averageDepartureTime}</td>
                    <td className="px-2 py-1 border text-center">{stat.attendanceDates.size}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Quick Report Generation */}
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
                onClick={() => generateReport(period, reportFormat)}
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
        allowPagination={true}
        allowDateFilter={true}
      />
    </div>
  );
};

export default OrganizationReports;