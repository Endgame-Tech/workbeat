import { ChartData } from 'chart.js';
import { AnalyticsData, AttendanceRecord, Employee } from '../types';

export interface AttendancePatternData {
  lateArrivals: number[];
  onTimeArrivals: number[];
  averageArrivalTime: string[];
  labels: string[];
}

export interface DepartmentAnalytics {
  departmentName: string;
  attendanceRate: number;
  lateArrivalRate: number;
  averageArrivalTime: string;
}

export const createTimePatternChart = (data: AnalyticsData['timePatterns']): ChartData => {
  return {
    labels: data.map(pattern => `${pattern.hour}:00`),
    datasets: [
      {
        label: 'Check-ins',
        data: data.map(pattern => pattern.checkIns),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        fill: true,
      },
      {
        label: 'Check-outs',
        data: data.map(pattern => pattern.checkOuts),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        fill: true,
      },
    ],
  };
};

export const createDepartmentChart = (data: AnalyticsData['departmentStats']): ChartData => {
  return {
    labels: data.map(dept => dept.department),
    datasets: [
      {
        label: 'Attendance Rate',
        data: data.map(dept => dept.avgAttendanceRate),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
      {
        label: 'Punctuality Rate',
        data: data.map(dept => dept.avgPunctualityRate),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1,
      },
    ],
  };
};

export const createLateArrivalTrendChart = (data: AnalyticsData['lateArrivalTrends']): ChartData => {
  return {
    labels: data.map(trend => new Date(trend.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Late Arrival Percentage',
        data: data.map(trend => trend.percentage),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        fill: true,
      },
    ],
  };
};

export const createWeeklyTrendChart = (data: AnalyticsData['weeklyTrends']): ChartData => {
  return {
    labels: data.map(trend => {
      const date = new Date(trend.week);
      return `Week of ${date.toLocaleDateString()}`;
    }),
    datasets: [
      {
        label: 'Attendance',
        data: data.map(trend => trend.attendance),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        fill: true,
      },
      {
        label: 'Punctuality',
        data: data.map(trend => trend.punctuality),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgb(53, 162, 235)',
        fill: true,
      },
    ],
  };
};

export const analyzeAttendancePatterns = (records: AttendanceRecord[]): AttendancePatternData => {
  const hourlyData: { [key: string]: { late: number; onTime: number; totalMinutes: number; count: number } } = {};
  
  records.forEach(record => {
    if (record.type === 'sign-in') {
      const date = new Date(record.timestamp);
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { late: 0, onTime: 0, totalMinutes: 0, count: 0 };
      }
      
      const isLate = record.isLate || false;
      
      hourlyData[hourKey] = {
        late: hourlyData[hourKey].late + (isLate ? 1 : 0),
        onTime: hourlyData[hourKey].onTime + (isLate ? 0 : 1),
        totalMinutes: hourlyData[hourKey].totalMinutes + minutes,
        count: hourlyData[hourKey].count + 1
      };
    }
  });

  const sortedHours = Object.keys(hourlyData).sort();
  return {
    lateArrivals: sortedHours.map(hour => hourlyData[hour].late),
    onTimeArrivals: sortedHours.map(hour => hourlyData[hour].onTime),
    averageArrivalTime: sortedHours.map(hour => {
      const avg = hourlyData[hour].totalMinutes / hourlyData[hour].count;
      return `${hour.split(':')[0]}:${Math.round(avg).toString().padStart(2, '0')}`;
    }),
    labels: sortedHours
  };
};

export const analyzeDepartmentAttendance = (
  records: AttendanceRecord[],
  employees: Employee[]
): DepartmentAnalytics[] => {
  // Create employee lookup map for department assignment
  const employeeDeptMap = employees.reduce((acc, emp) => {
    acc[emp.id.toString()] = emp.department;
    return acc;
  }, {} as Record<string, string>);

  // Get unique departments from employees
  const departments = [...new Set(employees.map(emp => emp.department).filter(dept => dept && dept.trim() !== ''))];

  const departmentData: { [key: string]: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    totalMinutes: number;
    count: number;
  }} = {};

  departments.forEach(dept => {
    departmentData[dept] = {
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      totalMinutes: 0,
      count: 0
    };
  });

  records.forEach(record => {
    if (record.type === 'sign-in') {
      const date = new Date(record.timestamp);
      const minutes = date.getHours() * 60 + date.getMinutes();

      // Get employee's actual department from the lookup map
      const dept = employeeDeptMap[record.employeeId] || 'Unknown';
      
      // Add Unknown department if it doesn't exist
      if (dept === 'Unknown' && !departmentData[dept]) {
        departmentData[dept] = {
          totalDays: 0,
          presentDays: 0,
          lateDays: 0,
          totalMinutes: 0,
          count: 0
        };
      }
      
      if (departmentData[dept]) {
        departmentData[dept].totalDays++;
        departmentData[dept].presentDays++;
        departmentData[dept].lateDays += record.isLate ? 1 : 0;
        departmentData[dept].totalMinutes += minutes;
        departmentData[dept].count++;
      }
    }
  });

  // Include all departments that have data (including Unknown)
  const allDepartments = Object.keys(departmentData).filter(dept => departmentData[dept].count > 0);
  
  return allDepartments.map(dept => ({
    departmentName: dept,
    attendanceRate: departmentData[dept].totalDays > 0 ? (departmentData[dept].presentDays / departmentData[dept].totalDays) * 100 : 0,
    lateArrivalRate: departmentData[dept].totalDays > 0 ? (departmentData[dept].lateDays / departmentData[dept].totalDays) * 100 : 0,
    averageArrivalTime: departmentData[dept].count > 0 ? formatAverageTime(
      departmentData[dept].totalMinutes / departmentData[dept].count
    ) : '00:00'
  }));
};

export const createAttendancePatternChart = (data: AttendancePatternData): ChartData => {
  return {
    labels: data.labels,
    datasets: [
      {
        label: 'On Time Arrivals',
        data: data.onTimeArrivals,
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: 'Late Arrivals',
        data: data.lateArrivals,
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  };
};

const formatAverageTime = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes < 0) {
    return '00:00';
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
