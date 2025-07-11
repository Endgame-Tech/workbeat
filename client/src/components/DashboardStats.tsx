import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle,
  UserCheck,
  CalendarClock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { AttendanceRecord, AttendanceStats } from '../types';
import { attendanceService } from '../services/attendanceService';
import { useWebSocket } from './context/WebSocketProvider';

interface DashboardStatsProps {
  employeeCount?: number;
  attendanceRecords?: AttendanceRecord[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  employeeCount,
  attendanceRecords = []
}) => {
  const { 
    isConnected, 
    lastAttendanceUpdate, 
    lastStatsUpdate,
    onAttendanceUpdate,
    onStatsUpdate 
  } = useWebSocket();
  
  const [loading, setLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentEmployees: 0,
    lateEmployees: 0,
    absentEmployees: 0,
    attendanceRate: 0,
    punctualityRate: 0,
    date: new Date().toISOString()
  });
  
  useEffect(() => {
    fetchAttendanceStats();
  }, []);
  
  // Update stats when props change
  useEffect(() => {
    if (employeeCount !== undefined) {
      updateStatsFromProps(employeeCount, attendanceRecords);
    }
  }, [employeeCount, attendanceRecords]);

  const fetchAttendanceStats = useCallback(async () => {
    setLoading(true);
    try {
      // Get today's attendance stats from API
      const todayStats = await attendanceService.getTodayStats();
      setStats(todayStats);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle real-time attendance updates
  useEffect(() => {
    if (!isConnected) return;

    const handleAttendanceUpdate = (attendanceData: any) => {
      console.log('📊 Real-time attendance update received:', attendanceData);
      // Refresh stats when attendance changes
      fetchAttendanceStats();
    };

    const handleStatsUpdate = (statsData: any) => {
      console.log('📈 Real-time stats update received:', statsData);
      // Refresh stats when stats trigger is received
      fetchAttendanceStats();
    };

    // Subscribe to real-time updates
    const unsubscribeAttendance = onAttendanceUpdate(handleAttendanceUpdate);
    const unsubscribeStats = onStatsUpdate(handleStatsUpdate);

    return () => {
      unsubscribeAttendance();
      unsubscribeStats();
    };
  }, [isConnected, onAttendanceUpdate, onStatsUpdate, fetchAttendanceStats]);
  
  // If we have props, use them to calculate stats
  const updateStatsFromProps = (totalActive: number, records: AttendanceRecord[]) => {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter records for today
    const todayRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    // Get unique employees who signed in today
    const uniqueEmployeesPresent = new Set(
      todayRecords
        .filter(record => record.type === 'sign-in')
        .map(record => record.employeeId)
    );
    
    const presentEmployees = uniqueEmployeesPresent.size;
    
    // Count late arrivals
    const lateEmployees = todayRecords.filter(
      record => record.type === 'sign-in' && record.isLate
    ).length;
    
    // Calculate absent as total minus present
    const absentEmployees = Math.max(0, totalActive - presentEmployees);
    
    // Calculate rates
    const attendanceRate = totalActive > 0 
      ? Math.round((presentEmployees / totalActive) * 100) 
      : 0;
    
    const punctualityRate = presentEmployees > 0 
      ? Math.round(((presentEmployees - lateEmployees) / presentEmployees) * 100) 
      : 0;
    
    setStats({
      totalEmployees: totalActive,
      presentEmployees,
      lateEmployees,
      absentEmployees,
      attendanceRate,
      punctualityRate,
      date: today.toISOString()
    });
    
    setLoading(false);
  };

  const statItems = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-primary-500 to-primary-600',
      iconBg: 'bg-primary-100 dark:bg-primary-900/30',
      iconColor: 'text-primary-600 dark:text-primary-400',
      change: null,
      trend: 'neutral'
    },
    {
      title: 'Present Today',
      value: stats.presentEmployees,
      icon: <UserCheck className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-success-500 to-success-600',
      iconBg: 'bg-success-100 dark:bg-success-900/30',
      iconColor: 'text-success-600 dark:text-success-400',
      change: stats.totalEmployees > 0 ? `${Math.round((stats.presentEmployees / stats.totalEmployees) * 100)}%` : null,
      trend: 'positive'
    },
    {
      title: 'Late Today',
      value: stats.lateEmployees,
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-warning-500 to-warning-600',
      iconBg: 'bg-warning-100 dark:bg-warning-900/30',
      iconColor: 'text-warning-600 dark:text-warning-400',
      change: stats.presentEmployees > 0 ? `${Math.round((stats.lateEmployees / stats.presentEmployees) * 100)}%` : null,
      trend: 'negative'
    },
    {
      title: 'Absent Today',
      value: stats.absentEmployees,
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-danger-500 to-danger-600',
      iconBg: 'bg-danger-100 dark:bg-danger-900/30',
      iconColor: 'text-danger-600 dark:text-danger-400',
      change: stats.totalEmployees > 0 ? `${Math.round((stats.absentEmployees / stats.totalEmployees) * 100)}%` : null,
      trend: 'negative'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent">
            Today's Overview
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 font-medium">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${
            isConnected
              ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
              : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-success-500" />
                <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></div>
                <span className="text-sm font-medium text-success-700 dark:text-success-300">Live updates</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-warning-500" />
                <span className="text-sm font-medium text-warning-700 dark:text-warning-300">Offline mode</span>
              </>
            )}
          </div>
          {lastUpdateTime && (
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      
      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(index => (
            <Card key={index} variant="elevated" className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center animate-pulse">
                  <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-xl mr-4 h-14 w-14"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-3/4 mb-3"></div>
                    <div className="h-7 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Stats Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((stat, index) => (
            <Card 
              key={index} 
              variant="elevated" 
              className="group overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer border-0 shadow-lg hover:shadow-xl"
            >
              <CardContent className="p-6 relative">
                {/* Background Gradient */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${stat.color} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity duration-300`}></div>
                
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                      <div className={stat.iconColor}>
                        {stat.icon}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-neutral-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                      {stat.change && (
                        <div className="flex items-center mt-2">
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            stat.trend === 'positive' 
                              ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                              : stat.trend === 'negative'
                              ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300'
                              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}>
                            {stat.change}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Rate Chart */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Attendance Rate
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Overall employee presence today
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="relative">
                <div className="relative h-32 w-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-neutral-200 dark:text-neutral-700"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-success-500 dark:text-success-400"
                      strokeWidth="8"
                      strokeDasharray={`${stats.attendanceRate * 2.64} 264`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                      style={{
                        animation: 'drawCircle 1.5s ease-out forwards',
                        strokeDashoffset: 264
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.attendanceRate}</span>
                      <span className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 ml-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={18} className="text-success-500" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Present
                    </span>
                  </div>
                  <span className="text-sm font-bold text-success-600 dark:text-success-400">
                    {stats.presentEmployees} of {stats.totalEmployees}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CalendarClock size={18} className="text-primary-500" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Today
                    </span>
                  </div>
                  <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Punctuality Rate Chart */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Punctuality Rate
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  On-time arrival performance
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="relative">
                <div className="relative h-32 w-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-neutral-200 dark:text-neutral-700"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-primary-500 dark:text-primary-400"
                      strokeWidth="8"
                      strokeDasharray={`${stats.punctualityRate * 2.64} 264`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                      style={{
                        animation: 'drawCircle 1.5s ease-out forwards 0.3s',
                        strokeDashoffset: 264
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.punctualityRate}</span>
                      <span className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 ml-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle size={18} className="text-warning-500" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Late arrivals
                    </span>
                  </div>
                  <span className="text-sm font-bold text-warning-600 dark:text-warning-400">
                    {stats.lateEmployees} employees
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock size={18} className="text-primary-500" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Schedule
                    </span>
                  </div>
                  <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                    Standard policy
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;