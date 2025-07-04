/**
 * Employee interface
 */
export interface Employee {
  id: number;
  _id?: string;
  organizationId: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  position: string;
  isActive: boolean;
  profileImage?: string;
  address?: string;
  hireDate?: string | Date;
  notes?: string;
  faceRecognition?: {
    faceId: string;
    faceImages: string[];
    lastUpdated: string;
  };
  workingHours: {
    start: string;
    end: string;
    breakStart?: string;
    breakEnd?: string;
  };
  phone: string;
  workSchedule: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  startDate?: string;
  employmentStatus?: 'full-time' | 'part-time' | 'contractor';
  accessLevel?: 'admin' | 'manager' | 'employee';
  biometrics?: {
    fingerprint?: {
      isEnrolled?: boolean;
      credentialId?: string | null;
      enrolledAt?: string;
    };
  };
}

/**
 * Attendance record interface
 */
export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName: string;
  organizationId: string;
  type: 'sign-in' | 'sign-out';
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  ipAddress?: string;
  isLate?: boolean;
  notes?: string;
  facialVerification?: boolean;
  facialCapture?: {
    image: string;
  };
  verificationMethod?: 'face-recognition' | 'fingerprint' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Daily attendance interface
 */
export interface DailyAttendance {
  _id: string;
  employeeId: string;
  organizationId: string;
  date: Date;
  status: 'present' | 'late' | 'absent' | 'leave' | 'holiday';
  signInTime?: Date;
  signOutTime?: Date;
  workDuration?: number; // in minutes
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}


/**
 * User interface
 */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  employeeId?: string;
  lastLogin?: string | Date;
}

/**
 * Attendance statistics interface
 */
export interface AttendanceStats {
  totalEmployees: number;
  presentEmployees: number;
  lateEmployees: number;
  absentEmployees: number;
  attendanceRate: number;
  punctualityRate: number;
  date: string;
  organizationId?: string;
}

/**
 * Department statistics interface
 */
export interface DepartmentStats {
  name: string;
  employeeCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
}

/**
 * API Response interface
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  message?: string;
  error?: string;
}

export interface AttendanceFormData {
  employeeId: string;
  type: 'sign-in' | 'sign-out';
  notes?: string;
}

/**
 * Analytics data interface
 */
export interface AnalyticsData {
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

/**
 * Advanced analytics interfaces
 */
export interface DetailedAttendanceStats extends AttendanceStats {
  lateArrivalStats: {
    under15Mins: number;
    under30Mins: number;
    over30Mins: number;
  };
  departmentBreakdown: {
    [department: string]: {
      attendanceRate: number;
      punctualityRate: number;
      averageArrivalTime: string;
    };
  };
  trends: {
    daily: {
      date: string;
      attendanceRate: number;
      punctualityRate: number;
    }[];
    weekly: {
      weekStartDate: string;
      attendanceRate: number;
      punctualityRate: number;
      avgDailyAttendance: number;
    }[];
    monthly: {
      month: string;
      attendanceRate: number;
      punctualityRate: number;
      trendDirection: 'up' | 'down' | 'stable';
    }[];
  };
  employeePerformance: {
    topAttendance: {
      employeeId: string;
      employeeName: string;
      rate: number;
    }[];
    mostPunctual: {
      employeeId: string;
      employeeName: string;
      rate: number;
    }[];
  };
}
