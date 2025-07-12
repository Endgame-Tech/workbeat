import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, TrendingUp, Award } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Employee, AttendanceRecord } from '../types';
import { attendanceService } from '../services/attendanceService';

interface EmployeeStatsModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  selectedMonth?: string; // Format: "2025-07"
}

interface MonthlyStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  earlyDepartures: number;
  totalHours: number;
  averageArrivalTime: string;
  averageDepartureTime: string;
  punctualityScore: number;
  attendanceRate: number;
  overtimeHours: number;
  records: AttendanceRecord[];
}

const EmployeeStatsModal: React.FC<EmployeeStatsModalProps> = ({
  employee,
  isOpen,
  onClose,
  selectedMonth = new Date().toISOString().slice(0, 7)
}) => {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedMonth);

  const fetchMonthlyStats = async () => {
    setLoading(true);
    try {
      // Calculate date range for the month
      const startDate = new Date(currentMonth + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      // Get employee ID
      const employeeId = employee.id || employee._id;
      if (!employeeId) {
        console.error('No employee ID found');
        return;
      }
      
      // Fetch attendance records for the month
      const records = await attendanceService.getEmployeeAttendance(
        String(employeeId),
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Calculate statistics
      const monthlyStats = calculateMonthlyStats(records, startDate, endDate);
      setStats(monthlyStats);
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && employee) {
      fetchMonthlyStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employee, currentMonth]);

  const calculateMonthlyStats = (records: AttendanceRecord[], startDate: Date, endDate: Date): MonthlyStats => {
    const workingDays = getWorkingDaysInMonth(startDate, endDate);
    const signInRecords = records.filter(r => r.type === 'sign-in');
    const signOutRecords = records.filter(r => r.type === 'sign-out');
    
    // Group records by date
    const recordsByDate = records.reduce((acc, record) => {
      const date = new Date(record.timestamp).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(record);
      return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    const presentDays = Object.keys(recordsByDate).length;
    const lateDays = signInRecords.filter(r => r.isLate).length;
    
    // Calculate total hours worked
    let totalHours = 0;
    let overtimeHours = 0;
    
    Object.values(recordsByDate).forEach(dayRecords => {
      const signIn = dayRecords.find(r => r.type === 'sign-in');
      const signOut = dayRecords.find(r => r.type === 'sign-out');
      
      if (signIn && signOut) {
        const hoursWorked = (new Date(signOut.timestamp).getTime() - new Date(signIn.timestamp).getTime()) / (1000 * 60 * 60);
        totalHours += hoursWorked;
        
        if (hoursWorked > 8) {
          overtimeHours += hoursWorked - 8;
        }
      }
    });

    // Calculate average times
    const avgArrivalTime = calculateAverageTime(signInRecords);
    const avgDepartureTime = calculateAverageTime(signOutRecords);
    
    // Calculate scores
    const attendanceRate = (presentDays / workingDays) * 100;
    const punctualityScore = presentDays > 0 ? ((presentDays - lateDays) / presentDays) * 100 : 100;

    return {
      totalDays: workingDays,
      presentDays,
      lateDays,
      earlyDepartures: 0, // TODO: Calculate based on expected departure time
      totalHours: Math.round(totalHours * 100) / 100,
      averageArrivalTime: avgArrivalTime,
      averageDepartureTime: avgDepartureTime,
      punctualityScore: Math.round(punctualityScore),
      attendanceRate: Math.round(attendanceRate),
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      records
    };
  };

  const getWorkingDaysInMonth = (startDate: Date, endDate: Date): number => {
    let workingDays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  };

  const calculateAverageTime = (records: AttendanceRecord[]): string => {
    if (records.length === 0) return 'N/A';
    
    const totalMinutes = records.reduce((sum, record) => {
      const time = new Date(record.timestamp);
      return sum + (time.getHours() * 60 + time.getMinutes());
    }, 0);
    
    const avgMinutes = totalMinutes / records.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.round(avgMinutes % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'danger' => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  const generateCalendarView = () => {
    if (!stats) return null;

    const monthStart = new Date(currentMonth + '-01');
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay()); // Start from Sunday

    const days = [];
    const current = new Date(startDate);

    // Create calendar grid
    for (let week = 0; week < 6; week++) {
      for (let day = 0; day < 7; day++) {
        const dayRecords = stats.records.filter(r => 
          new Date(r.timestamp).toDateString() === current.toDateString()
        );
        
        const isCurrentMonth = current.getMonth() === monthStart.getMonth();
        const isWeekend = current.getDay() === 0 || current.getDay() === 6;
        const hasRecord = dayRecords.length > 0;
        const isLate = dayRecords.some(r => r.type === 'sign-in' && r.isLate);
        
        let dayClass = 'w-8 h-8 flex items-center justify-center text-xs rounded-lg ';
        
        if (!isCurrentMonth) {
          dayClass += 'text-gray-300 dark:text-gray-600';
        } else if (isWeekend) {
          dayClass += 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800';
        } else if (hasRecord) {
          if (isLate) {
            dayClass += 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
          } else {
            dayClass += 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
          }
        } else {
          dayClass += 'text-gray-500 dark:text-gray-400 bg-red-50 dark:bg-red-900/20';
        }

        days.push(
          <div key={current.toISOString()} className={dayClass}>
            {current.getDate()}
          </div>
        );
        
        current.setDate(current.getDate() + 1);
      }
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center py-2">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                {employee.profileImage ? (
                  <img 
                    src={employee.profileImage} 
                    alt={employee.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="text-2xl font-bold">
                    {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <p className="text-white/80">{employee.department} • {employee.position}</p>
                <p className="text-white/60 text-sm">Employee ID: {employee.employeeId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="bg-white/20 text-white rounded-lg px-3 py-1 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = date.toISOString().slice(0, 7);
                  const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <option key={value} value={value} className="text-gray-900">
                      {label}
                    </option>
                  );
                })}
              </select>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X size={20} />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Loading statistics...</div>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {stats.attendanceRate}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</div>
                    <Badge 
                      type={getScoreColor(stats.attendanceRate)} 
                      text={stats.attendanceRate >= 95 ? 'Excellent' : stats.attendanceRate >= 90 ? 'Good' : 'Needs Improvement'}
                      size="sm"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.punctualityScore}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Punctuality</div>
                    <Badge 
                      type={getScoreColor(stats.punctualityScore)} 
                      text={stats.punctualityScore >= 95 ? 'Excellent' : stats.punctualityScore >= 85 ? 'Good' : 'Needs Improvement'}
                      size="sm"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.totalHours}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                    {stats.overtimeHours > 0 && (
                      <Badge type="info" text={`+${stats.overtimeHours}h OT`} size="sm" />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.presentDays}/{stats.totalDays}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days Present</div>
                    {stats.lateDays > 0 && (
                      <Badge type="warning" text={`${stats.lateDays} late`} size="sm" />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Calendar View */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Calendar className="mr-2" size={20} />
                    Monthly Calendar
                  </h3>
                </CardHeader>
                <CardContent>
                  {generateCalendarView()}
                  <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Present</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 rounded mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Late</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-50 dark:bg-red-900/20 rounded mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Absent</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-50 dark:bg-gray-800 rounded mr-2"></div>
                      <span className="text-gray-600 dark:text-gray-400">Weekend</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Time Patterns */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center">
                      <Clock className="mr-2" size={20} />
                      Time Patterns
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Average Arrival:</span>
                      <span className="font-semibold">{stats.averageArrivalTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Average Departure:</span>
                      <span className="font-semibold">{stats.averageDepartureTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Average Daily Hours:</span>
                      <span className="font-semibold">
                        {stats.presentDays > 0 ? (stats.totalHours / stats.presentDays).toFixed(1) : '0'}h
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center">
                      <Award className="mr-2" size={20} />
                      Performance Highlights
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.punctualityScore >= 95 && (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <Award size={16} className="mr-2" />
                        <span className="text-sm">Excellent Punctuality</span>
                      </div>
                    )}
                    {stats.attendanceRate >= 95 && (
                      <div className="flex items-center text-blue-600 dark:text-blue-400">
                        <TrendingUp size={16} className="mr-2" />
                        <span className="text-sm">Outstanding Attendance</span>
                      </div>
                    )}
                    {stats.overtimeHours > 10 && (
                      <div className="flex items-center text-purple-600 dark:text-purple-400">
                        <Clock size={16} className="mr-2" />
                        <span className="text-sm">High Dedication ({stats.overtimeHours}h OT)</span>
                      </div>
                    )}
                    {stats.lateDays === 0 && stats.presentDays > 0 && (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <Award size={16} className="mr-2" />
                        <span className="text-sm">Perfect Punctuality Record</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No data available for the selected month.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeStatsModal;
