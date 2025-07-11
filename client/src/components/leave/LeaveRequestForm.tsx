import React, { useState, useEffect } from 'react';
import { Calendar, Save, X, AlertCircle, Clock, Plus } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { LeaveType, LeaveRequest, Employee } from '../../types';
import { leaveService } from '../../services/leaveService';
import LeaveTypeForm from './LeaveTypeForm';
import { toast } from 'react-hot-toast';

interface LeaveRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: LeaveRequest) => void;
  leaveTypes: LeaveType[];
  employee: Employee | { id: number; name: string; email: string; role: string; };
  editingRequest?: LeaveRequest;
  onLeaveTypeCreated?: (leaveType: LeaveType) => void;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  leaveTypes,
  employee,
  editingRequest,
  onLeaveTypeCreated
}) => {
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    isEmergency: false,
    attachments: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalDays, setTotalDays] = useState(0);
  const [isLeaveTypeFormOpen, setIsLeaveTypeFormOpen] = useState(false);

  useEffect(() => {
    if (editingRequest) {
      setFormData({
        leaveTypeId: editingRequest.leaveTypeId.toString(),
        startDate: new Date(editingRequest.startDate).toISOString().split('T')[0],
        endDate: new Date(editingRequest.endDate).toISOString().split('T')[0],
        reason: editingRequest.reason,
        isEmergency: editingRequest.isEmergency,
        attachments: editingRequest.attachments || []
      });
    } else {
      setFormData({
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        isEmergency: false,
        attachments: []
      });
    }
  }, [editingRequest, isOpen]);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end >= start) {
        // Calculate working days (excluding weekends)
        let days = 0;
        const current = new Date(start);
        
        while (current <= end) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
            days++;
          }
          current.setDate(current.getDate() + 1);
        }
        
        setTotalDays(days);
      } else {
        setTotalDays(0);
      }
    } else {
      setTotalDays(0);
    }
  }, [formData.startDate, formData.endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    if (totalDays === 0) {
      toast.error('Please select valid working days');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const requestData = {
        ...formData,
        employeeId: employee.id,
        leaveTypeId: parseInt(formData.leaveTypeId),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      };

      let result: LeaveRequest;
      
      if (editingRequest) {
        result = await leaveService.updateLeaveRequest(editingRequest.id, requestData);
        toast.success('Leave request updated successfully');
      } else {
        result = await leaveService.createLeaveRequest(requestData);
        toast.success('Leave request submitted successfully');
      }
      
      onSubmit(result);
      onClose();
    } catch (error: unknown) {
      console.error('Error submitting leave request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit leave request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveTypeCreated = (newLeaveType: LeaveType) => {
    setFormData({ ...formData, leaveTypeId: newLeaveType.id.toString() });
    if (onLeaveTypeCreated) {
      onLeaveTypeCreated(newLeaveType);
    }
    toast.success('Leave type created successfully! It has been selected for your request.');
  };

  if (!isOpen) return null;

  const selectedLeaveType = leaveTypes.find(lt => lt.id.toString() === formData.leaveTypeId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {editingRequest ? 'Edit Leave Request' : 'New Leave Request'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type *
              </label>
              <div className="space-y-2">
                <select
                  value={formData.leaveTypeId}
                  onChange={(e) => {
                    if (e.target.value === 'create-new') {
                      setIsLeaveTypeFormOpen(true);
                    } else {
                      setFormData({ ...formData, leaveTypeId: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.filter(lt => lt.isActive).map((leaveType) => (
                    <option key={leaveType.id} value={leaveType.id}>
                      {leaveType.name}
                    </option>
                  ))}
                  <option value="create-new" className="text-blue-600 font-medium">
                    + Create New Leave Type
                  </option>
                </select>
                
                {leaveTypes.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        No leave types available. Please create a leave type first.
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsLeaveTypeFormOpen(true)}
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Create Leave Type
                    </Button>
                  </div>
                )}
              </div>
              
              {selectedLeaveType && (
                <p className="text-sm text-gray-600 mt-1">
                  Annual allocation: {selectedLeaveType.annualAllocation} days
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Total Days Display */}
            {totalDays > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Total working days: {totalDays}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                placeholder="Please provide a reason for your leave request..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Emergency Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isEmergency"
                checked={formData.isEmergency}
                onChange={(e) => setFormData({ ...formData, isEmergency: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isEmergency" className="text-sm text-gray-700 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                This is an emergency leave request
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Submitting...' : (editingRequest ? 'Update Request' : 'Submit Request')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Leave Type Form Modal */}
      <LeaveTypeForm
        isOpen={isLeaveTypeFormOpen}
        onClose={() => setIsLeaveTypeFormOpen(false)}
        onSubmit={handleLeaveTypeCreated}
      />
    </div>
  );
};

export default LeaveRequestForm;
