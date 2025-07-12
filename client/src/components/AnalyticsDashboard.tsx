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
  FileText,
  Plus
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import { AttendanceRecord, Employee } from '../types';
import { useOrganizationState } from '../hooks/useOrganizationState';
import { toast } from 'react-hot-toast';
import AnalyticsDashboardSkeleton from './AnalyticsDashboardSkeleton';
import { useSubscription } from '../hooks/useSubscription';
import { FeatureGate, FeatureButton } from './subscription/FeatureGate';
import SubscriptionStatus from './subscription/SubscriptionStatus';

interface AnalyticsData {
  departmentStats: {
    department: string;
    totalEmployees: number;
    presentToday: number;
    attendanceRate: number;
  }[];
  attendanceMetrics: {
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    attendanceRate: number;
  };
  timeAnalysis: {
    averageCheckInTime: string;
    averageCheckOutTime: string;
    averageWorkHours: number;
  };
  trends: {
    date: string;
    present: number;
    absent: number;
    late: number;
  }[];
}

interface DateRange {
  start: string;
  end: string;
}

interface AnalyticsDashboardProps {
  organizationId?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ organizationId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Use organization state hook
  const orgState = useOrganizationState(organizationId);
  
  // Use subscription hook
  useSubscription();

  const processAnalyticsData = useCallback(async () => {
    try {
      console.log('📊 Fetching analytics data for date range:', dateRange);
      
      const [attendanceRecords, employees] = await Promise.all([
        attendanceService.getAttendanceInRange(dateRange.start, dateRange.end),
        employeeService.getAllEmployees()
      ]);

      console.log('📈 Raw data received:', {
        attendanceRecords: attendanceRecords?.length || 0,
        employees: employees?.length || 0
      });

      // Process attendance metrics
      const totalEmployees = employees?.length || 0;
      const attendanceArray: AttendanceRecord[] = Array.isArray(attendanceRecords)
        ? attendanceRecords as AttendanceRecord[]
        : [];
      
      // Calculate attendance metrics
      // Present: type === 'sign-in'
      const presentRecords = attendanceArray.filter(record => record.type === 'sign-in');
      // Late: isLate === true
      const lateRecords = attendanceArray.filter(record => record.isLate === true);

      const totalPresent = presentRecords.length;
      const totalAbsent = Math.max(0, totalEmployees - totalPresent);
      const totalLate = lateRecords.length;
      const attendanceRate = totalEmployees > 0 ? (totalPresent / totalEmployees) * 100 : 0;

      // Process department stats
      type DepartmentStat = {
        department: string;
        totalEmployees: number;
        presentToday: number;
        attendanceRate: number;
      };
      const departmentStats = employees?.reduce((acc: DepartmentStat[], employee: Employee) => {
        const dept = employee.department || 'Unknown';
        const existing = acc.find((d: DepartmentStat) => d.department === dept);
        if (existing) {
          existing.totalEmployees += 1;
          // Count present employees for this department
        const deptPresentCount = presentRecords.filter(record => record.employeeId === employee.employeeId).length;
          existing.presentToday = deptPresentCount;
          existing.attendanceRate = existing.totalEmployees > 0 
            ? (existing.presentToday / existing.totalEmployees) * 100 
            : 0;
        } else {
        const deptPresentCount = presentRecords.filter(record => record.employeeId === employee.employeeId).length;
          acc.push({
            department: dept,
            totalEmployees: 1,
            presentToday: deptPresentCount,
            attendanceRate: deptPresentCount > 0 ? 100 : 0
          });
        }
        return acc;
      }, []) || [];

      // Process time analysis
      const checkInTimes = attendanceArray
        .map(record => record.timestamp)
        .filter((timestamp): timestamp is Date => Boolean(timestamp))
        .map(timestamp => new Date(timestamp));

      const averageCheckInTime = checkInTimes.length > 0
        ? new Date(checkInTimes.reduce((sum, time) => sum + time.getTime(), 0) / checkInTimes.length)
            .toTimeString().slice(0, 5)
        : '09:00';

      // No check-out or work hours data available, use defaults
      const averageCheckOutTime = '17:00';
      const averageWorkHours = 8;

      const analyticsData: AnalyticsData = {
        departmentStats,
        attendanceMetrics: {
          totalPresent,
          totalAbsent,
          totalLate,
          attendanceRate: Math.round(attendanceRate * 100) / 100
        },
        timeAnalysis: {
          averageCheckInTime,
          averageCheckOutTime,
          averageWorkHours: Math.round(averageWorkHours * 100) / 100
        },
        trends: [] // TODO: Calculate trends over time
      };

      console.log('📊 Processed analytics data:', analyticsData);
      return analyticsData;
    } catch (error) {
      console.error('Error processing analytics data:', error);
      throw error;
    }
  }, [dateRange]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Force refresh organization state to get latest employee count
        console.log('🔄 Refreshing organization state for analytics...');
        await orgState.refreshState();
        
        console.log('📊 Organization state:', {
          hasEmployees: orgState.hasEmployees,
          employeeCount: orgState.employeeCount,
          isNewOrganization: orgState.isNewOrganization,
          isLoading: orgState.isLoading
        });
        
        // Always try to fetch analytics data - let the backend determine if there's data
        const data = await processAnalyticsData();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Don't show toast for data loading errors - analytics page has proper empty states
      } finally {
        setLoading(false);
      }
    };
    
    // Always fetch data, don't depend on organization state
    fetchData();
  }, [dateRange.start, dateRange.end, processAnalyticsData, orgState]);

  if (loading) {
    return <AnalyticsDashboardSkeleton />;
  }

  // Show empty state only if we have no employees AND no analytics data
  if (orgState.isNewOrganization && (!analyticsData || analyticsData.attendanceMetrics.totalPresent === 0)) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive workforce analytics and insights</p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <BarChart3 size={48} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Analytics Data Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add employees and start tracking attendance to see analytics and insights.
                </p>
                <Button 
                  variant="primary" 
                  leftIcon={<Plus size={16} />}
                  onClick={() => window.location.href = `/organization/${organizationId}/employees`}
                >
                  Add Employees
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Comprehensive workforce analytics and insights</p>
      </div>

      {/* Subscription Status */}
      <div className="mb-6">
        <SubscriptionStatus compact={true} />
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-40"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-40"
          />
        </div>
        <Button
          variant="primary"
          onClick={() => {
            // Refresh data
            window.location.reload();
          }}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Update Analytics
        </Button>
      </div>

      {/* Analytics Cards */}
      <FeatureGate
        feature="analyticsCharts"
        requiredPlan="professional"
        fallbackMessage="Advanced analytics and charts require a Professional or Enterprise plan."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Present</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData?.attendanceMetrics.totalPresent || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Absent</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData?.attendanceMetrics.totalAbsent || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Late Arrivals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData?.attendanceMetrics.totalLate || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsData?.attendanceMetrics.attendanceRate.toFixed(1) || 0}%
                </p>
              </div>
              <PieChart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        </div>
      </FeatureGate>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Reports</h3>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <FeatureButton
              feature="dataExport"
              onClick={() => toast('CSV export feature coming soon')}
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export CSV
            </FeatureButton>
            <FeatureButton
              feature="dataExport"
              onClick={() => toast('PDF export feature coming soon')}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </FeatureButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;