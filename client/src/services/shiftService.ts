import api from './api';
import { ShiftTemplate, ScheduledShift, Pagination } from '../types';

export const shiftService = {
  // Shift Templates
  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    const response = await api.get('/api/shift-templates');
    return response.data.data || response.data;
  },

  async createShiftTemplate(template: {
    name: string;
    startTime: string;
    endTime: string;
    breakDuration: number;
    daysOfWeek: string[];
    isActive?: boolean;
  }): Promise<ShiftTemplate> {
    const response = await api.post('/api/shift-templates', template);
    return response.data.data || response.data;
  },

  async updateShiftTemplate(id: number, template: {
    name?: string;
    startTime?: string;
    endTime?: string;
    breakDuration?: number;
    daysOfWeek?: string[];
    isActive?: boolean;
  }): Promise<ShiftTemplate> {
    const response = await api.put(`/api/shift-templates/${id}`, template);
    return response.data.data || response.data;
  },

  async deleteShiftTemplate(id: number): Promise<void> {
    await api.delete(`/api/shift-templates/${id}`);
  },

  // Scheduled Shifts
  async getScheduledShifts(params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ScheduledShift[]; pagination: Pagination }> {
    const queryParams = new URLSearchParams();
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/api/scheduled-shifts?${queryParams.toString()}`);
    return response.data;
  },

  async createScheduledShift(shift: {
    employeeId: number;
    shiftTemplateId?: number;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }): Promise<ScheduledShift> {
    const response = await api.post('/api/scheduled-shifts', shift);
    return response.data.data || response.data;
  },

  async updateScheduledShift(id: number, shift: {
    employeeId?: number;
    shiftTemplateId?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
    notes?: string;
  }): Promise<ScheduledShift> {
    const response = await api.put(`/api/scheduled-shifts/${id}`, shift);
    return response.data.data || response.data;
  },

  async deleteScheduledShift(id: number): Promise<void> {
    await api.delete(`/api/scheduled-shifts/${id}`);
  },

  async bulkCreateShifts(shifts: Array<{
    employeeId: number;
    shiftTemplateId: number;
    date: string;
  }>): Promise<ScheduledShift[]> {
    const response = await api.post('/api/scheduled-shifts/bulk', { shifts });
    return response.data.data || response.data;
  },

  async getEmployeeSchedule(employeeId: number, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ScheduledShift[]> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/api/scheduled-shifts/employee/${employeeId}?${queryParams.toString()}`);
    return response.data.data || response.data;
  },

  async getShiftStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalShifts: number;
    completedShifts: number;
    missedShifts: number;
    cancelledShifts: number;
    completionRate: number;
    departmentBreakdown: Array<{
      department: string;
      totalShifts: number;
      completedShifts: number;
      completionRate: number;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const response = await api.get(`/api/scheduled-shifts/statistics?${queryParams.toString()}`);
    return response.data.data || response.data;
  }
};

export default shiftService;
