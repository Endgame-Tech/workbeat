import React, { useState, useEffect } from 'react';
import { Plus, Filter, RefreshCw, Calendar, Users, BarChart3, Clock, CheckCircle, XCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import LeaveRequestForm from './LeaveRequestForm';
import LeaveRequestsTable from './LeaveRequestsTable';
import LeaveBalanceDisplay from './LeaveBalanceDisplay';
import { LeaveType, LeaveRequest, LeaveBalance, Employee } from '../../types';
import { leaveService } from '../../services/leaveService';
import { employeeService } from '../../services/employeeService';
import { toast } from 'react-hot-toast';

interface LeaveManagementDashboardProps {
  currentUser: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  isAdmin: boolean;
}

const LeaveManagementDashboard: React.FC<LeaveManagementDashboardProps> = ({
  currentUser,
  isAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'balances' | 'types'>('requests');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);

  // Data states
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<number | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: '',
    endDate: ''
  });

  const loadLeaveTypes = React.useCallback(async () => {
    try {
      const data = await leaveService.getLeaveTypes();
      setLeaveTypes(data);
    } catch (error) {
      console.error('Error loading leave types:', error);
    }
  }, []);

  const loadLeaveRequests = React.useCallback(async () => {
    try {
      const filters: Record<string, string | number> = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (employeeFilter) filters.employeeId = employeeFilter;
      if (dateRangeFilter.startDate) filters.startDate = dateRangeFilter.startDate;
      if (dateRangeFilter.endDate) filters.endDate = dateRangeFilter.endDate;

      const data = await leaveService.getLeaveRequests(filters);
      setLeaveRequests(data);
    } catch (error) {
      console.error('Error loading leave requests:', error);
    }
  }, [statusFilter, employeeFilter, dateRangeFilter]);

  const loadLeaveBalances = React.useCallback(async () => {
    try {
      const data = await leaveService.getLeaveBalances({
        year: new Date().getFullYear()
      });
      setLeaveBalances(data);
    } catch (error) {
      console.error('Error loading leave balances:', error);
    }
  }, []);

  const loadData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load employees first
      try {
        const employeesData = await employeeService.getAllEmployees(true);
        setEmployees(employeesData || []);
      } catch (employeeError) {
        console.warn('No employees found or failed to load employees:', employeeError);
        setEmployees([]);
        // Don't show error toast for missing employees - it's normal for new organizations
      }

      // Load leave data
      await Promise.all([
        loadLeaveTypes(),
        loadLeaveRequests(),
        loadLeaveBalances()
      ]);
    } catch (error) {
      console.error('Error loading leave management data:', error);
      // Only show error for critical failures, not missing data
      if (error.response && error.response.status >= 500) {
        toast.error('Failed to load leave management data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadLeaveTypes, loadLeaveRequests, loadLeaveBalances]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleCreateRequest = () => {
    setEditingRequest(null);
    setIsFormOpen(true);
  };

  const handleEditRequest = (request: LeaveRequest) => {
    setEditingRequest(request);
    setIsFormOpen(true);
  };

  const handleSubmitRequest = async () => {
    await loadLeaveRequests();
    await loadLeaveBalances(); // Refresh balances as they might have changed
  };

  const handleLeaveTypeCreated = async (newLeaveType: LeaveType) => {
    await loadLeaveTypes(); // Refresh leave types
    setLeaveTypes(prev => [...prev, newLeaveType]);
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      await leaveService.approveLeaveRequest(requestId, currentUser.id);
      toast.success('Leave request approved successfully');
      await loadLeaveRequests();
      await loadLeaveBalances();
    } catch (error) {
      console.error('Error approving leave request:', error);
      toast.error('Failed to approve leave request');
    }
  };

  const handleRejectRequest = async (requestId: number, reason: string) => {
    try {
      await leaveService.rejectLeaveRequest(requestId, currentUser.id, reason);
      toast.success('Leave request rejected');
      await loadLeaveRequests();
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      toast.error('Failed to reject leave request');
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) {
      return;
    }

    try {
      await leaveService.deleteLeaveRequest(requestId);
      toast.success('Leave request deleted successfully');
      await loadLeaveRequests();
      await loadLeaveBalances();
    } catch (error) {
      console.error('Error deleting leave request:', error);
      toast.error('Failed to delete leave request');
    }
  };

  const handleFiltersChange = () => {
    loadLeaveRequests();
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setEmployeeFilter(null);
    setDateRangeFilter({ startDate: '', endDate: '' });
  };

  const getRequestsStats = () => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter(r => r.status === 'pending').length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;

    return { total, pending, approved, rejected };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading leave management data...</p>
        </div>
      </div>
    );
  }

  const stats = getRequestsStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600">Manage employee leave requests and balances</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="primary"
            onClick={handleCreateRequest}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Leave Requests
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('balances')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'balances'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Leave Balances
            </div>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('types')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'types'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leave Types
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Filters (for requests tab) */}
      {activeTab === 'requests' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              
              {isAdmin && (
                <select
                  value={employeeFilter || ''}
                  onChange={(e) => setEmployeeFilter(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              )}
              
              <input
                type="date"
                placeholder="Start Date"
                value={dateRangeFilter.startDate}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
              
              <input
                type="date"
                placeholder="End Date"
                value={dateRangeFilter.endDate}
                onChange={(e) => setDateRangeFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFiltersChange}
              >
                Apply
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content */}
      <div>
        {activeTab === 'requests' && (
          <LeaveRequestsTable
            requests={leaveRequests}
            leaveTypes={leaveTypes}
            employees={employees}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            onEdit={handleEditRequest}
            onDelete={handleDeleteRequest}
            currentUserId={currentUser?.id}
            isAdmin={isAdmin}
          />
        )}
        
        {activeTab === 'balances' && (
          <LeaveBalanceDisplay
            balances={leaveBalances}
            leaveTypes={leaveTypes}
            employees={employees}
            employeeId={!isAdmin ? currentUser?.id : undefined}
            showEmployeeNames={isAdmin}
          />
        )}
        
        {activeTab === 'types' && isAdmin && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Leave Types Configuration</h3>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Leave types management coming soon...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Leave Request Form Modal */}
      <LeaveRequestForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmitRequest}
        leaveTypes={leaveTypes}
        employee={currentUser}
        editingRequest={editingRequest || undefined}
        onLeaveTypeCreated={handleLeaveTypeCreated}
      />
    </div>
  );
};

export default LeaveManagementDashboard;
