import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle,
  UserCheck,
  CalendarClock
} from 'lucide-react';
import { AttendanceRecord, AttendanceStats } from '../types';
import { attendanceService } from '../services/attendanceService';

interface DashboardStatsProps {
  employeeCount?: number;
  attendanceRecords?: AttendanceRecord[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  employeeCount,
  attendanceRecords = []
}) => {
  const [loading, setLoading] = useState(true);
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

  const fetchAttendanceStats = async () => {
    setLoading(true);
    try {
      // Get today's attendance stats from API
      const todayStats = await attendanceService.getTodayStats();
      setStats(todayStats);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
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
      icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      color: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Present Today',
      value: stats.presentEmployees,
      icon: <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />,
      color: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Late Today',
      value: stats.lateEmployees,
      icon: <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      color: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      title: 'Absent Today',
      value: stats.absentEmployees,
      icon: <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />,
      color: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
        Today's Overview
      </h2>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(index => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg mr-4 h-12 w-12"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Attendance Rate
            </h3>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-green-500 dark:text-green-400"
                    strokeWidth="10"
                    strokeDasharray={`${stats.attendanceRate * 2.51} 251`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.attendanceRate}%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center mb-1">
                  <CheckCircle size={16} className="text-green-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {stats.presentEmployees} of {stats.totalEmployees} employees present
                  </span>
                </div>
                <div className="flex items-center">
                  <CalendarClock size={16} className="text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Punctuality Rate
            </h3>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-blue-500 dark:text-blue-400"
                    strokeWidth="10"
                    strokeDasharray={`${stats.punctualityRate * 2.51} 251`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.punctualityRate}%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center mb-1">
                  <AlertCircle size={16} className="text-amber-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {stats.lateEmployees} employees were late today
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Standard arrival based on schedule
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