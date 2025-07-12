import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Eye
} from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { LeaveRequest, LeaveType, Employee } from '../../types';
import { toast } from 'react-hot-toast';

interface LeaveRequestsTableProps {
  requests: LeaveRequest[];
  leaveTypes: LeaveType[];
  employees: Employee[];
  onApprove: (requestId: number) => void;
  onReject: (requestId: number, reason: string) => void;
  onEdit: (request: LeaveRequest) => void;
  onDelete: (requestId: number) => void;
  currentUserId?: number;
  isAdmin?: boolean;
}

const LeaveRequestsTable: React.FC<LeaveRequestsTableProps> = ({
  requests,
  leaveTypes,
  employees,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  currentUserId,
  isAdmin = false
}) => {
  const [rejectingRequest, setRejectingRequest] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const getLeaveTypeName = (leaveTypeId: number) => {
    const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.name : 'Unknown Type';
  };

  const getLeaveTypeColor = (leaveTypeId: number) => {
    const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId);
    return leaveType ? leaveType.color : '#6B7280';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    if (rejectingRequest) {
      onReject(rejectingRequest, rejectionReason);
      setRejectingRequest(null);
      setRejectionReason('');
    }
  };

  const canUserModify = (request: LeaveRequest) => {
    return isAdmin || request.employeeId === currentUserId;
  };

  const canUserApprove = (request: LeaveRequest) => {
    return isAdmin && request.employeeId !== currentUserId && request.status === 'pending';
  };

  const sortedRequests = [...requests].sort((a, b) => {
    // Sort by status (pending first), then by creation date (newest first)
    if (a.status !== b.status) {
      if (a.status === 'pending') return -1;
      if (b.status === 'pending') return 1;
      return 0;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Requests
          </h3>
        </CardHeader>
        
        <CardContent>
          {sortedRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No leave requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Employee</th>
                    <th className="text-left py-3 px-4">Leave Type</th>
                    <th className="text-left py-3 px-4">Dates</th>
                    <th className="text-left py-3 px-4">Days</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Requested</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {getEmployeeName(request.employeeId)}
                          </span>
                          {request.isEmergency && (
                            <div title="Emergency Leave">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <span 
                          className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getLeaveTypeColor(request.leaveTypeId) }}
                        >
                          {getLeaveTypeName(request.leaveTypeId)}
                        </span>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{formatDate(request.startDate)}</div>
                          <div className="text-gray-500">to {formatDate(request.endDate)}</div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <span className="font-medium">{request.totalDays}</span>
                      </td>
                      
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingRequest(request)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canUserModify(request) && request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(request)}
                                title="Edit Request"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(request.id)}
                                title="Delete Request"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {canUserApprove(request) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onApprove(request.id)}
                                title="Approve Request"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRejectingRequest(request.id)}
                                title="Reject Request"
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h3 className="text-lg font-semibold text-red-600">Reject Leave Request</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for rejection *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    placeholder="Please provide a reason for rejecting this request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRejectingRequest(null);
                      setRejectionReason('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleRejectSubmit}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reject Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Details Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-semibold">Leave Request Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingRequest(null)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee</label>
                    <p className="text-sm text-gray-900">{getEmployeeName(viewingRequest.employeeId)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                    <span 
                      className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getLeaveTypeColor(viewingRequest.leaveTypeId) }}
                    >
                      {getLeaveTypeName(viewingRequest.leaveTypeId)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="text-sm text-gray-900">{formatDate(viewingRequest.startDate)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <p className="text-sm text-gray-900">{formatDate(viewingRequest.endDate)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Days</label>
                    <p className="text-sm text-gray-900">{viewingRequest.totalDays}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingRequest.status)}`}>
                      {getStatusIcon(viewingRequest.status)}
                      {viewingRequest.status.charAt(0).toUpperCase() + viewingRequest.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{viewingRequest.reason}</p>
                </div>
                
                {viewingRequest.isEmergency && (
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Emergency Leave Request</span>
                    </div>
                  </div>
                )}
                
                {viewingRequest.status === 'rejected' && viewingRequest.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded-md">{viewingRequest.rejectionReason}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Requested:</span> {formatDate(viewingRequest.createdAt)}
                  </div>
                  {viewingRequest.approvedAt && (
                    <div>
                      <span className="font-medium">
                        {viewingRequest.status === 'approved' ? 'Approved:' : 'Rejected:'}
                      </span> {formatDate(viewingRequest.approvedAt)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default LeaveRequestsTable;
