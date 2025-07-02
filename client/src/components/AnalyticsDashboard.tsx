import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Download, 
  PieChart,
  LineChart,
  FileText,
  Settings
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import { exportService, ExportOptions } from '../services/exportService';
import { AttendanceRecord, Employee } from '../types';
import { toast } from 'react-hot-toast';

interface AnalyticsData {
  departmentStats: {
    department: string;
    totalEmployees: number;
    avgAttendanceRate: number;
    avgPunctualityRate: number;
    totalHours: number;
    lateArrivals: number;
  }[];
  timePatterns: {
    hour: number;
    checkIns: number;
    checkOuts: number;
    avgEmployees: number;
  }[];
  lateArrivalTrends: {
    date: string;
    lateCount: number;
    totalCheckIns: number;
    percentage: number;
  }[];
  topPerformers: {
    employee: Employee;
    attendanceRate: number;
    punctualityRate: number;
    totalHours: number;
  }[];
  weeklyTrends: {
    week: string;
    attendance: number;
    punctuality: number;
    avgHours: number;
  }[];
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState<'overview' | 'patterns' | 'departments' | 'custom'>('overview');
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Custom Report Builder State
  const [customReport, setCustomReport] = useState({
    template: 'Monthly Attendance Summary',
    metrics: ['Attendance Rate', 'Punctuality Score', 'Total Hours', 'Department Comparison', 'Time Patterns', 'Employee Notes & Reasons'],
    format: 'PDF Report'
  });
  const [generatingCustomReport, setGeneratingCustomReport] = useState(false);

  // Template configurations for different report types
  const reportTemplates = {
    'Monthly Attendance Summary': {
      description: 'Comprehensive monthly overview of attendance patterns and statistics',
      recommendedMetrics: ['Attendance Rate', 'Punctuality Score', 'Department Comparison'],
      defaultFormat: 'PDF Report'
    },
    'Department Performance Report': {
      description: 'Compare performance metrics across different departments',
      recommendedMetrics: ['Department Comparison', 'Attendance Rate', 'Total Hours'],
      defaultFormat: 'Excel Spreadsheet'
    },
    'Individual Employee Report': {
      description: 'Detailed analysis for specific employees including attendance notes and explanations',
      recommendedMetrics: ['Attendance Rate', 'Punctuality Score', 'Total Hours', 'Time Patterns', 'Employee Notes & Reasons'],
      defaultFormat: 'PDF Report'
    },
    'Late Arrival Analysis': {
      description: 'Focus on punctuality trends with employee-provided reasons for late arrivals',
      recommendedMetrics: ['Punctuality Score', 'Time Patterns', 'Department Comparison', 'Employee Notes & Reasons'],
      defaultFormat: 'Excel Spreadsheet'
    },
    'Productivity Trends': {
      description: 'Analyze productivity patterns and working hour trends',
      recommendedMetrics: ['Total Hours', 'Overtime Hours', 'Time Patterns', 'Attendance Rate'],
      defaultFormat: 'PDF Report'
    }
  };

  const getWorkingDays = useCallback(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    let workingDays = 0;
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
        workingDays++;
      }
    }
    
    return workingDays;
  }, [dateRange.start, dateRange.end]);

  const calculateDepartmentStats = useCallback((records: AttendanceRecord[], employees: Employee[]) => {
    const departmentMap = new Map<string, {
      employees: Set<string>;
      totalRecords: number;
      lateRecords: number;
      totalHours: number;
    }>();

    // Group employees by department
    employees.forEach(emp => {
      const dept = emp.department || 'Unknown';
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, {
          employees: new Set(),
          totalRecords: 0,
          lateRecords: 0,
          totalHours: 0
        });
      }
    });

    // Process attendance records
    records.forEach(record => {
      const employee = employees.find(emp => (emp.id || emp._id) === record.employeeId);
      const dept = employee?.department || 'Unknown';
      
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, {
          employees: new Set(),
          totalRecords: 0,
          lateRecords: 0,
          totalHours: 0
        });
      }

      const deptData = departmentMap.get(dept)!;
      deptData.employees.add(record.employeeId);
      
      if (record.type === 'sign-in') {
        deptData.totalRecords++;
        if (record.isLate) {
          deptData.lateRecords++;
        }
      }
    });

    const workingDays = getWorkingDays();
    return Array.from(departmentMap.entries()).map(([department, data]) => ({
      department,
      totalEmployees: data.employees.size,
      avgAttendanceRate: data.totalRecords > 0 ? Math.round((data.totalRecords / (data.employees.size * workingDays)) * 100) : 0,
      avgPunctualityRate: data.totalRecords > 0 ? Math.round(((data.totalRecords - data.lateRecords) / data.totalRecords) * 100) : 100,
      totalHours: data.totalHours,
      lateArrivals: data.lateRecords
    }));
  }, [getWorkingDays]);

  const calculateTimePatterns = useCallback((records: AttendanceRecord[]) => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      checkIns: 0,
      checkOuts: 0,
      avgEmployees: 0
    }));

    records.forEach(record => {
      const hour = new Date(record.timestamp).getHours();
      if (record.type === 'sign-in') {
        hourlyData[hour].checkIns++;
      } else if (record.type === 'sign-out') {
        hourlyData[hour].checkOuts++;
      }
    });

    return hourlyData;
  }, []);

  const calculateLateArrivalTrends = useCallback((records: AttendanceRecord[]) => {
    const dailyData = new Map<string, { total: number; late: number }>();
    
    records.filter(r => r.type === 'sign-in').forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { total: 0, late: 0 });
      }
      const dayData = dailyData.get(date)!;
      dayData.total++;
      if (record.isLate) {
        dayData.late++;
      }
    });

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        lateCount: data.late,
        totalCheckIns: data.total,
        percentage: data.total > 0 ? Math.round((data.late / data.total) * 100) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  const calculateTopPerformers = useCallback((records: AttendanceRecord[], employees: Employee[]) => {
    const employeeStats = new Map<string, {
      totalDays: number;
      lateDays: number;
      totalHours: number;
    }>();

    // Calculate stats for each employee
    records.forEach(record => {
      if (!employeeStats.has(record.employeeId)) {
        employeeStats.set(record.employeeId, {
          totalDays: 0,
          lateDays: 0,
          totalHours: 0
        });
      }
      
      const stats = employeeStats.get(record.employeeId)!;
      if (record.type === 'sign-in') {
        stats.totalDays++;
        if (record.isLate) {
          stats.lateDays++;
        }
      }
    });

    const workingDays = getWorkingDays();
    return Array.from(employeeStats.entries())
      .map(([employeeId, stats]) => {
        const employee = employees.find(emp => (emp.id || emp._id) === employeeId);
        if (!employee) return null;
        
        return {
          employee,
          attendanceRate: Math.round((stats.totalDays / workingDays) * 100),
          punctualityRate: stats.totalDays > 0 ? Math.round(((stats.totalDays - stats.lateDays) / stats.totalDays) * 100) : 100,
          totalHours: stats.totalHours
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b!.attendanceRate + b!.punctualityRate) - (a!.attendanceRate + a!.punctualityRate))
      .slice(0, 10) as Array<{
        employee: Employee;
        attendanceRate: number;
        punctualityRate: number;
        totalHours: number;
      }>;
  }, [getWorkingDays]);

  const calculateWeeklyTrends = useCallback((records: AttendanceRecord[]) => {
    const weeklyData = new Map<string, {
      checkIns: number;
      lateCheckIns: number;
      totalHours: number;
    }>();

    records.forEach(record => {
      const date = new Date(record.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          checkIns: 0,
          lateCheckIns: 0,
          totalHours: 0
        });
      }

      const weekData = weeklyData.get(weekKey)!;
      if (record.type === 'sign-in') {
        weekData.checkIns++;
        if (record.isLate) {
          weekData.lateCheckIns++;
        }
      }
    });

    return Array.from(weeklyData.entries())
      .map(([week, data]) => ({
        week,
        attendance: data.checkIns,
        punctuality: data.checkIns > 0 ? Math.round(((data.checkIns - data.lateCheckIns) / data.checkIns) * 100) : 100,
        avgHours: data.totalHours / Math.max(data.checkIns, 1)
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, []);

  const processAnalyticsData = useCallback((records: AttendanceRecord[], employees: Employee[]): AnalyticsData => {
    // Create employee lookup map
    employees.reduce((acc, emp) => {
      const empId = emp.id || emp._id;
      if (empId) {
        acc[empId] = emp;
      }
      return acc;
    }, {} as Record<string, Employee>);

    // Department statistics
    const departmentStats = calculateDepartmentStats(records, employees);
    
    // Time patterns (hourly distribution)
    const timePatterns = calculateTimePatterns(records);
    
    // Late arrival trends (daily)
    const lateArrivalTrends = calculateLateArrivalTrends(records);
    
    // Top performers
    const topPerformers = calculateTopPerformers(records, employees);
    
    // Weekly trends
    const weeklyTrends = calculateWeeklyTrends(records);

    return {
      departmentStats,
      timePatterns,
      lateArrivalTrends,
      topPerformers,
      weeklyTrends
    };
  }, [calculateDepartmentStats, calculateTimePatterns, calculateLateArrivalTrends, calculateTopPerformers, calculateWeeklyTrends]);

  const handleExportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    if (!analytics) {
      toast.error('No analytics data available to export');
      return;
    }

    try {
      toast.loading(`Generating ${format.toUpperCase()} report...`);
      
      // Prepare export options
      const exportOptions: ExportOptions = {
        dateRange,
        reportType,
        selectedDepartment: 'all',
        analytics
      };

      // Use the export service
      switch (format) {
        case 'pdf':
          await exportService.exportToPDF(exportOptions);
          break;
        case 'csv':
          await exportService.exportToCSV(exportOptions);
          break;
        case 'excel':
          await exportService.exportToExcel(exportOptions);
          break;
      }
      
      toast.dismiss();
      toast.success(`${format.toUpperCase()} report downloaded successfully!`);
      setShowExportOptions(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss();
      toast.error(`Failed to generate ${format} report`);
    }
  };

  const handleGenerateCustomReport = async () => {
    if (!analytics) {
      toast.error('No analytics data available to generate report');
      return;
    }

    if (customReport.metrics.length === 0) {
      toast.error('Please select at least one metric to include in the report');
      return;
    }

    setGeneratingCustomReport(true);
    
    try {
      toast.loading(`Generating ${customReport.template.toLowerCase()}...`);
      
      // Route to specific template handler based on selection
      switch (customReport.template) {
        case 'Individual Employee Report':
          await generateIndividualEmployeeReport();
          break;
        case 'Department Performance Report':
          await generateDepartmentPerformanceReport();
          break;
        case 'Monthly Attendance Summary':
          await generateMonthlyAttendanceReport();
          break;
        case 'Late Arrival Analysis':
          await generateLateArrivalReport();
          break;
        case 'Productivity Trends':
          await generateProductivityTrendsReport();
          break;
        default:
          // Fallback to generic custom report
          await generateGenericCustomReport();
          break;
      }
      
      toast.dismiss();
      toast.success(
        `${customReport.template} successfully generated as ${customReport.format}! 
        ${customReport.metrics.length} metrics included.`
      );
    } catch (error) {
      console.error('Custom report generation error:', error);
      toast.dismiss();
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('network')) {
          toast.error('Network error: Please check your connection and try again.');
        } else if (error.message.includes('permission')) {
          toast.error('Permission error: You may not have access to generate reports.');
        } else {
          toast.error(`Failed to generate ${customReport.template.toLowerCase()}: ${error.message}`);
        }
      } else {
        toast.error(`Failed to generate ${customReport.template.toLowerCase()}. Please try again.`);
      }
    } finally {
      setGeneratingCustomReport(false);
    }
  };

  const handleCustomReportChange = (field: string, value: string | string[]) => {
    setCustomReport(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateChange = (templateName: string) => {
    const template = reportTemplates[templateName as keyof typeof reportTemplates];
    if (template) {
      setCustomReport(prev => ({
        ...prev,
        template: templateName,
        metrics: template.recommendedMetrics,
        format: template.defaultFormat
      }));
    }
  };

  const renderOverviewCards = () => {
    if (!analytics) return null;

    const totalEmployees = analytics.departmentStats.reduce((sum, dept) => sum + dept.totalEmployees, 0);
    const avgAttendanceRate = analytics.departmentStats.reduce((sum, dept) => sum + dept.avgAttendanceRate, 0) / analytics.departmentStats.length;
    const totalLateArrivals = analytics.departmentStats.reduce((sum, dept) => sum + dept.lateArrivals, 0);
    const peakHour = analytics.timePatterns.reduce((max, curr) => curr.checkIns > max.checkIns ? curr : max);

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-primary-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Attendance</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{Math.round(avgAttendanceRate)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Late Arrivals</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{totalLateArrivals}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Peak Hour</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{peakHour.hour}:00</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDepartmentAnalytics = () => {
    if (!analytics) return null;

    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <PieChart className="mr-2" size={20} />
            Department Analytics
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold">Department</th>
                  <th className="text-left py-3 px-4 font-semibold">Employees</th>
                  <th className="text-left py-3 px-4 font-semibold">Attendance Rate</th>
                  <th className="text-left py-3 px-4 font-semibold">Punctuality Rate</th>
                  <th className="text-left py-3 px-4 font-semibold">Late Arrivals</th>
                </tr>
              </thead>
              <tbody>
                {analytics.departmentStats.map((dept, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-medium">{dept.department}</td>
                    <td className="py-3 px-4">{dept.totalEmployees}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${dept.avgAttendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{dept.avgAttendanceRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${dept.avgPunctualityRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{dept.avgPunctualityRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dept.lateArrivals === 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : dept.lateArrivals < 5
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {dept.lateArrivals}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTimePatterns = () => {
    if (!analytics) return null;

    const maxCheckIns = Math.max(...analytics.timePatterns.map(t => t.checkIns));

    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <LineChart className="mr-2" size={20} />
            Hourly Activity Patterns
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.timePatterns.filter(t => t.checkIns > 0 || t.checkOuts > 0).map(pattern => (
              <div key={pattern.hour} className="flex items-center space-x-4">
                <div className="w-16 text-sm font-medium">
                  {pattern.hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(pattern.checkIns / maxCheckIns) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 w-8">
                      {pattern.checkIns}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(pattern.checkOuts / maxCheckIns) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 w-8">
                      {pattern.checkOuts}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span>Check-ins</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span>Check-outs</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTopPerformers = () => {
    if (!analytics) return null;

    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Top Performers
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformers.slice(0, 5).map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-bold">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {performer.employee.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {performer.employee.department}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {performer.attendanceRate}% attendance
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {performer.punctualityRate}% punctual
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Template-specific report generators
  const generateIndividualEmployeeReport = async () => {
    try {
      // Fetch fresh employee and attendance data
      const employees = await employeeService.getAllEmployees();
      const records = await attendanceService.getAttendanceReport(dateRange.start, dateRange.end);
      
      const formatMap: Record<string, 'pdf' | 'excel' | 'csv'> = {
        'PDF Report': 'pdf',
        'Excel Spreadsheet': 'excel', 
        'CSV Data': 'csv',
        'PowerPoint Presentation': 'pdf'
      };
      
      const exportFormat = formatMap[customReport.format] || 'pdf';
      
      // Generate individual reports for each employee
      for (const employee of employees.filter((emp: Employee) => emp.isActive)) {
        // Filter records for this specific employee
        const employeeRecords = records.filter((record: AttendanceRecord) => 
          record.employeeId === (employee.id || employee._id)
        );
        
        if (employeeRecords.length === 0) continue; // Skip employees with no records
        
        // Calculate employee-specific analytics
        const employeeAnalytics = processEmployeeSpecificAnalytics(employee, employeeRecords);
        
        const exportOptions: ExportOptions = {
          dateRange,
          reportType: `individual-employee-${employee.name.replace(/\s+/g, '-').toLowerCase()}`,
          selectedDepartment: employee.department || 'unknown',
          analytics: employeeAnalytics,
          includeCharts: true,
          includeNotes: true
        };
        
        // Generate report for this specific employee
        await exportService.exportCustomReport(
          `Individual Report - ${employee.name}`,
          customReport.metrics,
          exportFormat,
          exportOptions
        );
      }
    } catch (error) {
      console.error('Individual employee report error:', error);
      throw error;
    }
  };

  const generateDepartmentPerformanceReport = async () => {
    try {
      const employees = await employeeService.getAllEmployees();
      const records = await attendanceService.getAttendanceReport(dateRange.start, dateRange.end);
      
      const formatMap: Record<string, 'pdf' | 'excel' | 'csv'> = {
        'PDF Report': 'pdf',
        'Excel Spreadsheet': 'excel',
        'CSV Data': 'csv', 
        'PowerPoint Presentation': 'pdf'
      };
      
      const exportFormat = formatMap[customReport.format] || 'excel';
      
      // Group employees by department
      const departmentGroups = employees.reduce((acc: Record<string, Employee[]>, emp: Employee) => {
        const dept = emp.department || 'Unknown';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(emp);
        return acc;
      }, {} as Record<string, Employee[]>);
      
      // Process department-specific analytics
      const departmentAnalytics = processDepartmentSpecificAnalytics(departmentGroups, records);
      
      const exportOptions: ExportOptions = {
        dateRange,
        reportType: 'department-performance',
        selectedDepartment: 'all',
        analytics: departmentAnalytics,
        includeCharts: true
      };
      
      await exportService.exportCustomReport(
        'Department Performance Analysis',
        customReport.metrics,
        exportFormat,
        exportOptions
      );
    } catch (error) {
      console.error('Department performance report error:', error);
      throw error;
    }
  };

  const generateMonthlyAttendanceReport = async () => {
    try {
      const records = await attendanceService.getAttendanceReport(dateRange.start, dateRange.end);
      
      const formatMap: Record<string, 'pdf' | 'excel' | 'csv'> = {
        'PDF Report': 'pdf',
        'Excel Spreadsheet': 'excel',
        'CSV Data': 'csv',
        'PowerPoint Presentation': 'pdf'
      };
      
      const exportFormat = formatMap[customReport.format] || 'pdf';
      
      // Process monthly aggregated data
      const monthlyAnalytics = processMonthlyAnalytics(records);
      
      const exportOptions: ExportOptions = {
        dateRange,
        reportType: 'monthly-attendance-summary',
        selectedDepartment: 'all',
        analytics: monthlyAnalytics,
        includeCharts: true
      };
      
      await exportService.exportCustomReport(
        'Monthly Attendance Summary',
        customReport.metrics,
        exportFormat,
        exportOptions
      );
    } catch (error) {
      console.error('Monthly attendance report error:', error);
      throw error;
    }
  };

  const generateLateArrivalReport = async () => {
    try {
      const records = await attendanceService.getAttendanceReport(dateRange.start, dateRange.end);
      
      const formatMap: Record<string, 'pdf' | 'excel' | 'csv'> = {
        'PDF Report': 'pdf',
        'Excel Spreadsheet': 'excel',
        'CSV Data': 'csv',
        'PowerPoint Presentation': 'pdf'
      };
      
      const exportFormat = formatMap[customReport.format] || 'excel';
      
      // Filter to only late arrival records
      const lateRecords = records.filter((record: AttendanceRecord) => 
        record.type === 'sign-in' && record.isLate
      );
      
      if (lateRecords.length === 0) {
        throw new Error('No late arrival records found in the selected date range');
      }
      
      // Fetch employee data for names
      const employees = await employeeService.getAllEmployees();
      const employeeMap = employees.reduce((acc: Record<string, Employee>, emp: Employee) => {
        const empId = emp.id || emp._id;
        if (empId) {
          acc[empId] = emp;
        }
        return acc;
      }, {});
      
      // Process late arrival specific analytics with enhanced notes focus
      const lateArrivalAnalytics = processLateArrivalAnalytics(lateRecords, employeeMap);
      
      const exportOptions: ExportOptions = {
        dateRange,
        reportType: 'late-arrival-analysis',
        selectedDepartment: 'all',
        analytics: lateArrivalAnalytics,
        includeCharts: true,
        includeNotes: true
      };
      
      await exportService.exportCustomReport(
        'Late Arrival Analysis with Notes',
        customReport.metrics,
        exportFormat,
        exportOptions
      );
    } catch (error) {
      console.error('Late arrival report error:', error);
      throw error;
    }
  };

  const generateProductivityTrendsReport = async () => {
    try {
      const records = await attendanceService.getAttendanceReport(dateRange.start, dateRange.end);
      
      const formatMap: Record<string, 'pdf' | 'excel' | 'csv'> = {
        'PDF Report': 'pdf',
        'Excel Spreadsheet': 'excel',
        'CSV Data': 'csv',
        'PowerPoint Presentation': 'pdf'
      };
      
      const exportFormat = formatMap[customReport.format] || 'pdf';
      
      // Process productivity-focused analytics
      const productivityAnalytics = processProductivityAnalytics(records);
      
      const exportOptions: ExportOptions = {
        dateRange,
        reportType: 'productivity-trends',
        selectedDepartment: 'all',
        analytics: productivityAnalytics,
        includeCharts: true
      };
      
      await exportService.exportCustomReport(
        'Productivity Trends Analysis',
        customReport.metrics,
        exportFormat,
        exportOptions
      );
    } catch (error) {
      console.error('Productivity trends report error:', error);
      throw error;
    }
  };

  const generateGenericCustomReport = async () => {
    // Fallback to original generic implementation
    const formatMap: Record<string, 'pdf' | 'excel' | 'csv'> = {
      'PDF Report': 'pdf',
      'Excel Spreadsheet': 'excel',
      'CSV Data': 'csv',
      'PowerPoint Presentation': 'pdf'
    };
    
    const exportFormat = formatMap[customReport.format] || 'pdf';
    
    const exportOptions: ExportOptions = {
      dateRange,
      reportType: 'custom',
      selectedDepartment: 'all',
      analytics: analytics!,
      includeCharts: true
    };

    await exportService.exportCustomReport(
      customReport.template,
      customReport.metrics,
      exportFormat,
      exportOptions
    );
  };

  // Helper functions to process different types of analytics
  const processEmployeeSpecificAnalytics = (employee: Employee, records: AttendanceRecord[]): AnalyticsData => {
    // Calculate employee-specific metrics
    const employeeStats = {
      totalRecords: records.length,
      signInRecords: records.filter(r => r.type === 'sign-in').length,
      lateRecords: records.filter(r => r.type === 'sign-in' && r.isLate).length,
      recordsWithNotes: records.filter(r => r.notes && r.notes.trim()).length,
      attendanceRate: 0,
      punctualityRate: 0
    };

    if (employeeStats.signInRecords > 0) {
      employeeStats.punctualityRate = Math.round(
        ((employeeStats.signInRecords - employeeStats.lateRecords) / employeeStats.signInRecords) * 100
      );
    }

    // Create analytics focused on this single employee with notes emphasis
    return {
      departmentStats: [{
        department: employee.department || 'Unknown',
        totalEmployees: 1,
        avgAttendanceRate: employeeStats.attendanceRate,
        avgPunctualityRate: employeeStats.punctualityRate,
        totalHours: 0,
        lateArrivals: employeeStats.lateRecords
      }],
      timePatterns: calculateTimePatterns(records),
      lateArrivalTrends: calculateLateArrivalTrends(records),
      topPerformers: [{
        employee,
        attendanceRate: employeeStats.attendanceRate,
        punctualityRate: employeeStats.punctualityRate,
        totalHours: 0
      }],
      weeklyTrends: calculateWeeklyTrends(records)
    };
  };

  const processDepartmentSpecificAnalytics = (
    departmentGroups: Record<string, Employee[]>, 
    records: AttendanceRecord[]
  ): AnalyticsData => {
    // Calculate department-focused analytics
    const departmentStats = Object.entries(departmentGroups).map(([dept, employees]) => {
      const deptRecords = records.filter((record: AttendanceRecord) => 
        employees.some((emp: Employee) => (emp.id || emp._id) === record.employeeId)
      );
      const signInRecords = deptRecords.filter((r: AttendanceRecord) => r.type === 'sign-in');
      const lateRecords = deptRecords.filter((r: AttendanceRecord) => r.type === 'sign-in' && r.isLate);
      
      return {
        department: dept,
        totalEmployees: employees.length,
        avgAttendanceRate: Math.round((signInRecords.length / employees.length) * 100),
        avgPunctualityRate: signInRecords.length > 0 
          ? Math.round(((signInRecords.length - lateRecords.length) / signInRecords.length) * 100)
          : 100,
        totalHours: 0,
        lateArrivals: lateRecords.length
      };
    });

    return {
      departmentStats,
      timePatterns: calculateTimePatterns(records),
      lateArrivalTrends: calculateLateArrivalTrends(records),
      topPerformers: [],
      weeklyTrends: calculateWeeklyTrends(records)
    };
  };

  const processMonthlyAnalytics = (records: AttendanceRecord[]): AnalyticsData => {
    // Group records by month and calculate monthly trends
    const monthlyData = new Map<string, { signIns: number; lateArrivals: number }>();
    
    records.filter((r: AttendanceRecord) => r.type === 'sign-in').forEach((record: AttendanceRecord) => {
      const monthKey = new Date(record.timestamp).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { signIns: 0, lateArrivals: 0 });
      }
      const monthData = monthlyData.get(monthKey)!;
      monthData.signIns++;
      if (record.isLate) monthData.lateArrivals++;
    });

    return {
      departmentStats: [],
      timePatterns: calculateTimePatterns(records),
      lateArrivalTrends: calculateLateArrivalTrends(records),
      topPerformers: [],
      weeklyTrends: calculateWeeklyTrends(records)
    };
  };

  const processLateArrivalAnalytics = (lateRecords: AttendanceRecord[], employeeMap?: Record<string, Employee>): AnalyticsData => {
    // Focus entirely on late arrival patterns with enhanced notes analysis
    
    // Group late arrivals by employee with notes
    const employeeLateArrivals = new Map<string, {
      count: number;
      records: AttendanceRecord[];
      employee?: Employee;
      notesWithReasons: string[];
    }>();
    
    lateRecords.forEach((record: AttendanceRecord) => {
      const empId = record.employeeId;
      if (!employeeLateArrivals.has(empId)) {
        employeeLateArrivals.set(empId, {
          count: 0,
          records: [],
          employee: employeeMap?.[empId],
          notesWithReasons: []
        });
      }
      
      const empData = employeeLateArrivals.get(empId)!;
      empData.count++;
      empData.records.push(record);
      
      // Collect notes for analysis
      if (record.notes && record.notes.trim()) {
        empData.notesWithReasons.push(record.notes.trim());
      }
    });
    
    // Create department stats focusing on late arrivals
    const departmentLateStats = new Map<string, { total: number; withNotes: number; withoutNotes: number }>();
    
    Array.from(employeeLateArrivals.values()).forEach(empData => {
      const dept = empData.employee?.department || 'Unknown';
      if (!departmentLateStats.has(dept)) {
        departmentLateStats.set(dept, { total: 0, withNotes: 0, withoutNotes: 0 });
      }
      
      const deptStats = departmentLateStats.get(dept)!;
      deptStats.total += empData.count;
      
      empData.records.forEach(record => {
        if (record.notes && record.notes.trim()) {
          deptStats.withNotes++;
        } else {
          deptStats.withoutNotes++;
        }
      });
    });
    
    const departmentStats = Array.from(departmentLateStats.entries()).map(([dept, stats]) => ({
      department: dept,
      totalEmployees: Array.from(employeeLateArrivals.values()).filter(emp => 
        emp.employee?.department === dept || (!emp.employee?.department && dept === 'Unknown')
      ).length,
      avgAttendanceRate: 0, // Not applicable for late arrival analysis
      avgPunctualityRate: 0, // All are late arrivals
      totalHours: 0,
      lateArrivals: stats.total
    }));

    return {
      departmentStats,
      timePatterns: calculateTimePatterns(lateRecords),
      lateArrivalTrends: calculateLateArrivalTrends(lateRecords),
      topPerformers: [], // Not applicable for late arrival analysis
      weeklyTrends: calculateWeeklyTrends(lateRecords)
    };
  };

  const processProductivityAnalytics = (records: AttendanceRecord[]): AnalyticsData => {
    // Focus on working hours and productivity patterns
    return {
      departmentStats: [],
      timePatterns: calculateTimePatterns(records),
      lateArrivalTrends: [],
      topPerformers: [],
      weeklyTrends: calculateWeeklyTrends(records)
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch attendance records for the date range
        const records = await attendanceService.getAttendanceReport(dateRange.start, dateRange.end);
        const employees = await employeeService.getAllEmployees();
        
        // Process analytics data
        const analyticsData = processAnalyticsData(records, employees);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange.start, dateRange.end, processAnalyticsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Reporting</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive workforce analytics and insights</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-40"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-40"
            />
          </div>
          
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowExportOptions(!showExportOptions)}
              leftIcon={<Download size={16} />}
            >
              Export
            </Button>
            
            {showExportOptions && (
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 w-48 z-50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportReport('pdf')}
                  leftIcon={<FileText size={16} />}
                  className="w-full justify-start"
                >
                  Export as PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportReport('csv')}
                  leftIcon={<FileText size={16} />}
                  className="w-full justify-start"
                >
                  Export as CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportReport('excel')}
                  leftIcon={<FileText size={16} />}
                  className="w-full justify-start"
                >
                  Export as Excel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'patterns', label: 'Time Patterns', icon: Clock },
          { key: 'departments', label: 'Departments', icon: Users },
          { key: 'custom', label: 'Custom Report', icon: Settings }
        ].map(tab => (
          <Button
            key={tab.key}
            variant={reportType === tab.key ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setReportType(tab.key as 'overview' | 'patterns' | 'departments' | 'custom')}
            leftIcon={<tab.icon size={16} />}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Cards */}
      {reportType === 'overview' && renderOverviewCards()}

      {/* Content based on selected report type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportType === 'overview' && (
          <>
            {renderDepartmentAnalytics()}
            {renderTopPerformers()}
          </>
        )}
        
        {reportType === 'patterns' && (
          <>
            {renderTimePatterns()}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Late Arrival Trends</h3>
              </CardHeader>
              <CardContent>
                {analytics?.lateArrivalTrends.slice(-7).map(trend => (
                  <div key={trend.date} className="flex items-center justify-between py-2">
                    <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{trend.lateCount}/{trend.totalCheckIns}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        trend.percentage === 0 ? 'bg-green-100 text-green-800' :
                        trend.percentage < 20 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {trend.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
        
        {reportType === 'departments' && (
          <div className="lg:col-span-2">
            {renderDepartmentAnalytics()}
          </div>
        )}
        
        {reportType === 'custom' && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Custom Report Builder</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Report Template</label>
                    <select 
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={customReport.template}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                    >
                      {Object.keys(reportTemplates).map(template => (
                        <option key={template} value={template}>
                          {template}
                        </option>
                      ))}
                    </select>
                    {reportTemplates[customReport.template as keyof typeof reportTemplates] && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {reportTemplates[customReport.template as keyof typeof reportTemplates].description}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Metrics Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Include Metrics</label>
                      <div className="space-y-3">
                        {[
                          'Attendance Rate',
                          'Punctuality Score',
                          'Total Hours',
                          'Overtime Hours',
                          'Department Comparison',
                          'Time Patterns',
                          'Employee Notes & Reasons'
                        ].map(metric => (
                          <label key={metric} className="flex items-center group cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                              checked={customReport.metrics.includes(metric)}
                              onChange={(e) => {
                                const newMetrics = e.target.checked
                                  ? [...customReport.metrics, metric]
                                  : customReport.metrics.filter(m => m !== metric);
                                handleCustomReportChange('metrics', newMetrics);
                              }}
                            />
                            <span className="text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {metric}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {customReport.metrics.length} metric{customReport.metrics.length !== 1 ? 's' : ''} selected
                      </p>
                    </div>
                    
                    {/* Format Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Export Format</label>
                      <div className="space-y-3">
                        {[
                          { value: 'PDF Report', label: 'PDF Report', description: 'Professional document format' },
                          { value: 'Excel Spreadsheet', label: 'Excel Spreadsheet', description: 'Editable data tables' },
                          { value: 'CSV Data', label: 'CSV Data', description: 'Raw data for analysis' },
                          { value: 'PowerPoint Presentation', label: 'PowerPoint Presentation', description: 'Presentation-ready slides' }
                        ].map(format => (
                          <label key={format.value} className="flex items-start group cursor-pointer">
                            <input 
                              type="radio" 
                              name="format" 
                              className="mr-3 mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                              checked={customReport.format === format.value}
                              onChange={() => handleCustomReportChange('format', format.value)}
                            />
                            <div className="flex-1">
                              <span className="text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {format.label}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {format.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      variant="primary"
                      onClick={handleGenerateCustomReport}
                      isLoading={generatingCustomReport}
                      disabled={!analytics || customReport.metrics.length === 0}
                      leftIcon={<FileText size={16} />}
                      className="flex-1"
                    >
                      {generatingCustomReport ? 'Generating...' : 'Generate Report'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      disabled={generatingCustomReport}
                      className="px-6"
                    >
                      Save Template
                    </Button>
                  </div>
                  
                  {/* Selected Configuration Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Report Preview:</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">Template:</span> 
                        <div className="flex-1">
                          <p className="font-medium">{customReport.template}</p>
                          <p className="text-xs mt-1">
                            {customReport.template === 'Individual Employee Report' && 'Generates separate reports for each active employee with detailed individual metrics and attendance notes.'}
                            {customReport.template === 'Department Performance Report' && 'Compares performance across departments with ranking and comparison metrics.'}
                            {customReport.template === 'Monthly Attendance Summary' && 'Provides month-by-month attendance trends and summary statistics.'}
                            {customReport.template === 'Late Arrival Analysis' && 'Focuses specifically on late arrival patterns with employee-provided reasons and explanations.'}
                            {customReport.template === 'Productivity Trends' && 'Analyzes working hours, productivity patterns, and time utilization.'}
                          </p>
                        </div>
                      </div>
                      <p><span className="font-medium">Format:</span> {customReport.format}</p>
                      <p><span className="font-medium">Metrics:</span> {customReport.metrics.join(', ')}</p>
                      {(customReport.template === 'Individual Employee Report' || customReport.template === 'Late Arrival Analysis') && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                          <p className="text-xs text-green-700 dark:text-green-300">
                            📝 This report includes employee notes and explanations captured during sign-in
                          </p>
                        </div>
                      )}
                      {customReport.template === 'Individual Employee Report' && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            📊 This will generate multiple files - one report per employee
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
