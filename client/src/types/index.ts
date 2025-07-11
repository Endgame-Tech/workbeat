export interface Holiday {
  date: string;
  name: string;
  description?: string;
  type?: string;
}
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
 * Enhanced Attendance record interface with comprehensive data capture
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
    address?: string;
    accuracy?: number;
    source?: 'gps' | 'wifi' | 'cell' | 'manual';
  } | null;
  ipAddress?: string;
  isLate?: boolean;
  lateMinutes?: number;
  notes?: string;
  noteCategory?: 'transport' | 'health' | 'personal' | 'work' | 'weather' | 'other';
  facialVerification?: boolean;
  facialCapture?: {
    image: string;
    confidence?: number;
    quality?: 'low' | 'medium' | 'high';
  };
  verificationMethod?: 'face-recognition' | 'fingerprint' | 'manual' | 'qr-code' | 'nfc';
  device?: {
    type: 'mobile' | 'desktop' | 'tablet' | 'kiosk';
    browser?: string;
    os?: string;
    userAgent?: string;
  };
  weather?: {
    condition: string;
    temperature: number;
    description: string;
  };
  workSession?: {
    expectedStartTime: string;
    expectedEndTime: string;
    actualDuration?: number;
    breakDuration?: number;
    overtime?: number;
  };
  managerOverride?: {
    overriddenBy: string;
    reason: string;
    originalTimestamp: Date;
  };
  geofenceCompliant?: boolean;
  networkInfo?: {
    wifi?: string;
    signal?: 'strong' | 'medium' | 'weak';
  };
  offline?: boolean; // Flag to indicate if this record was created offline
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
  organizationId?: string;
  organization?: {
    id: string;
    name?: string;
  };
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
 * Enhanced Analytics data interface with comprehensive insights
 */
export interface AnalyticsData {
  departmentStats: {
    department: string;
    totalEmployees: number;
    avgAttendanceRate: number;
    avgPunctualityRate: number;
    totalHours: number;
    lateArrivals: number;
    earlyDepartures: number;
    overtime: number;
    costImpact: number;
    productivityScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  }[];
  timePatterns: {
    hour: number;
    checkIns: number;
    checkOuts: number;
    avgEmployees: number;
    productivity: number;
    commonReasons: string[];
  }[];
  lateArrivalTrends: {
    date: string;
    lateCount: number;
    totalCheckIns: number;
    percentage: number;
    avgLateMinutes: number;
    commonReasons: string[];
    weatherImpact: boolean;
  }[];
  topPerformers: {
    employee: Employee;
    attendanceRate: number;
    punctualityRate: number;
    totalHours: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
    consistencyScore: number;
  }[];
  weeklyTrends: {
    week: string;
    attendance: number;
    punctuality: number;
    avgHours: number;
    overtime: number;
    productivity: number;
    anomalies: string[];
  }[];
  insights: {
    keyFindings: string[];
    riskAlerts: string[];
    opportunities: string[];
    recommendations: string[];
    costSavings: number;
    complianceScore: number;
  };
  predictiveMetrics: {
    expectedAttendance: number;
    riskEmployees: string[];
    seasonalTrends: string[];
    burnoutIndicators: string[];
  };
  noteAnalysis: {
    categories: {
      category: string;
      count: number;
      percentage: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }[];
    sentiment: {
      positive: number;
      neutral: number;
      negative: number;
    };
    commonPatterns: string[];
    actionableInsights: string[];
  };
}

/**
 * Executive Summary Interface
 */
export interface ExecutiveSummary {
  reportPeriod: {
    startDate: string;
    endDate: string;
    workingDays: number;
  };
  keyMetrics: {
    totalEmployees: number;
    overallAttendanceRate: number;
    punctualityRate: number;
    avgDailyAttendance: number;
    totalLateIncidents: number;
    costImpact: number;
    productivityIndex: number;
    complianceScore: number;
  };
  trends: {
    attendanceTrend: 'improving' | 'stable' | 'declining';
    punctualityTrend: 'improving' | 'stable' | 'declining';
    weekOverWeekChange: number;
    monthOverMonthChange: number;
    seasonalFactors: string[];
  };
  criticalInsights: {
    topConcerns: string[];
    quickWins: string[];
    longTermActions: string[];
    budgetImpact: number;
  };
  departmentHighlights: {
    bestPerforming: string;
    needsAttention: string;
    mostImproved: string;
    riskiest: string;
  };
  employeeInsights: {
    topPerformers: string[];
    riskEmployees: string[];
    newHires: string[];
    improvingEmployees: string[];
  };
}

/**
 * Operational Intelligence Interface
 */
export interface OperationalIntelligence {
  dailyAlerts: {
    type: 'attendance' | 'punctuality' | 'anomaly' | 'compliance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    affectedEmployees: string[];
    recommendedAction: string;
    dueDate?: string;
  }[];
  patternDetection: {
    unusualPatterns: string[];
    emergingTrends: string[];
    seasonalFactors: string[];
    externalFactors: string[];
  };
  resourceOptimization: {
    overstaffedHours: number[];
    understaffedHours: number[];
    optimalShiftTimes: string[];
    capacityUtilization: number;
  };
  complianceTracking: {
    regulatoryCompliance: number;
    policyViolations: number;
    auditReadiness: number;
    documentationGaps: string[];
  };
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

/**
 * Leave Management Types
 */
export interface LeaveType {
  id: number;
  organizationId: number;
  name: string;
  annualAllocation: number;
  requiresApproval: boolean;
  adviceNoticeDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  carryOverDays: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  employee?: Employee;
  leaveType?: LeaveType;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: Date;
  rejectionReason?: string;
  attachments?: string[];
  isEmergency: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  employee?: Employee;
  leaveType?: LeaveType;
  approver?: Employee;
}

/**
 * Shift Scheduling Types
 */
export interface ShiftTemplate {
  id: number;
  organizationId: number;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  daysOfWeek: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    scheduledShifts: number;
  };
}

export interface ScheduledShift {
  id: number;
  employeeId: number;
  organizationId: number;
  shiftTemplateId?: number;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  employee?: Employee;
  shiftTemplate?: ShiftTemplate;
}

/**
 * Notification Types
 */
export interface NotificationTemplate {
  id: number;
  organizationId: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  event: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'shift_assigned' | 'shift_reminder' | 'attendance_reminder';
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: number;
  employeeId: number;
  email: boolean;
  sms: boolean;
  push: boolean;
  leaveRequests: boolean;
  shiftChanges: boolean;
  attendanceReminders: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  employee?: Employee;
}

export interface NotificationQueue {
  id: number;
  employeeId: number;
  templateId: number;
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  employee?: Employee;
  template?: NotificationTemplate;
}

/**
 * Pagination interface
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  [key: string]: number | string | undefined;
}

/**
 * Organization Settings Interface
 */
export interface OrganizationSettings {
  timezone?: string;
  workWeek?: string[];
  defaultShiftStart?: string;
  defaultShiftEnd?: string;
  allowOvertime?: boolean;
  [key: string]: string | string[] | boolean | undefined;
}

/**
 * Subscription Data Interface
 */
export interface SubscriptionData {
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  renewalDate?: string;
  [key: string]: string | undefined;
}

/**
 * Organization User Data Interface
 */
export interface OrganizationUserData {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  [key: string]: string | undefined;
}

/**
 * Department Data Interface
 */
export interface DepartmentData {
  id?: string;
  name: string;
  description?: string;
  [key: string]: string | undefined;
}

/**
 * Cache Data Interfaces
 */
export interface EmployeeCacheData {
  id: string;
  organizationId: string;
  // Add all employee fields you want to cache
  [key: string]: unknown;
}

export interface OrganizationCacheData {
  id: string;
  // Add all organization fields you want to cache
  [key: string]: unknown;
}

export interface ApiResponseCacheData {
  url: string;
  method: string;
  // The actual response data
  [key: string]: unknown;
}

export interface AnalyticsCacheData {
  id: string;
  organizationId: string;
  type: string;
  dateRange: string;
  // The actual analytics data
  [key: string]: unknown;
}

export interface SettingsCacheData {
  key: string;
  // The actual settings data
  [key: string]: unknown;
}
