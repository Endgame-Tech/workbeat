import api from './api';
import { LeaveType, LeaveRequest, LeaveBalance } from '../types';

export const leaveService = {
  // Leave Types
  async getLeaveTypes(): Promise<LeaveType[]> {
    const response = await api.get('/api/leave-types');
    return response.data.data || response.data;
  },

  async createLeaveType(leaveType: {
    name: string;
    annualAllocation: number;
    requiresApproval: boolean;
    adviceNoticeDays: number;
    isActive?: boolean;
  }): Promise<LeaveType> {
    const response = await api.post('/api/leave-types', leaveType);
    return response.data.data || response.data;
  },

  async updateLeaveType(id: number, leaveType: {
    name?: string;
    annualAllocation?: number;
    requiresApproval?: boolean;
    adviceNoticeDays?: number;
    isActive?: boolean;
  }): Promise<LeaveType> {
    const response = await api.put(`/api/leave-types/${id}`, leaveType);
    return response.data.data || response.data;
  },

  async deleteLeaveType(id: number): Promise<void> {
    await api.delete(`/api/leave-types/${id}`);
  },

  // Leave Requests
  async getLeaveRequests(params?: {
    employeeId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequest[]> {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/api/leave-requests?${queryParams.toString()}`);
    return response.data.data || response.data;
  },

  async createLeaveRequest(leaveRequest: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'totalDays'>): Promise<LeaveRequest> {
    const response = await api.post('/api/leave-requests', leaveRequest);
    return response.data;
  },

  async updateLeaveRequest(id: number, leaveRequest: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const response = await api.put(`/api/leave-requests/${id}`, leaveRequest);
    return response.data;
  },

  async approveLeaveRequest(id: number, approverId: number): Promise<LeaveRequest> {
    const response = await api.put(`/api/leave-requests/${id}/approve`, { approverId });
    return response.data;
  },

  async rejectLeaveRequest(id: number, approverId: number, rejectionReason: string): Promise<LeaveRequest> {
    const response = await api.put(`/api/leave-requests/${id}/reject`, { approverId, rejectionReason });
    return response.data;
  },

  async deleteLeaveRequest(id: number): Promise<void> {
    await api.delete(`/api/leave-requests/${id}`);
  },

  // Leave Balances
  async getLeaveBalances(params?: {
    employeeId?: number;
    year?: number;
  }): Promise<LeaveBalance[]> {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId.toString());
    if (params?.year) queryParams.append('year', params.year.toString());

    const response = await api.get(`/api/leave-balances?${queryParams.toString()}`);
    return response.data.data || response.data;
  },

  async updateLeaveBalance(id: number, balance: Partial<LeaveBalance>): Promise<LeaveBalance> {
    const response = await api.put(`/api/leave-balances/${id}`, balance);
    return response.data;
  },

  async initializeLeaveBalances(year: number): Promise<LeaveBalance[]> {
    const response = await api.post('/api/leave-balances/initialize', { year });
    return response.data.data || response.data;
  },

  // Utility functions
  async getEmployeeLeaveCalendar(employeeId: number, year: number): Promise<{
    requests: LeaveRequest[];
    balances: LeaveBalance[];
  }> {
    const response = await api.get(`/api/leave-requests/employee/${employeeId}/calendar/${year}`);
    return response.data;
  },

  async getLeaveStatistics(year?: number): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalDaysRequested: number;
    totalDaysApproved: number;
    leaveTypeBreakdown: Array<{
      leaveType: string;
      count: number;
      totalDays: number;
    }>;
  }> {
    const params = year ? `?year=${year}` : '';
    const response = await api.get(`/api/leave-requests/statistics${params}`);
    return response.data.data || response.data;
  }
};

export default leaveService;
