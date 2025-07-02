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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Report Template</label>
                    <select className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                      <option>Monthly Attendance Summary</option>
                      <option>Department Performance Report</option>
                      <option>Individual Employee Report</option>
                      <option>Late Arrival Analysis</option>
                      <option>Productivity Trends</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Include Metrics</label>
                      <div className="space-y-2">
                        {[
                          'Attendance Rate',
                          'Punctuality Score',
                          'Total Hours',
                          'Overtime Hours',
                          'Department Comparison',
                          'Time Patterns'
                        ].map(metric => (
                          <label key={metric} className="flex items-center">
                            <input type="checkbox" className="mr-2" defaultChecked />
                            <span className="text-sm">{metric}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Export Format</label>
                      <div className="space-y-2">
                        {['PDF Report', 'Excel Spreadsheet', 'CSV Data', 'PowerPoint Presentation'].map(format => (
                          <label key={format} className="flex items-center">
                            <input type="radio" name="format" className="mr-2" />
                            <span className="text-sm">{format}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="primary">Generate Report</Button>
                    <Button variant="ghost">Save Template</Button>
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
