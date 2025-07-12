import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { LeaveType } from '../../types';
import { leaveService } from '../../services/leaveService';
import { toast } from 'react-hot-toast';

interface LeaveTypeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leaveType: LeaveType) => void;
  editingLeaveType?: LeaveType;
}

const LeaveTypeForm: React.FC<LeaveTypeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingLeaveType
}) => {
  const [formData, setFormData] = useState({
    name: '',
    annualAllocation: 20,
    requiresApproval: true,
    adviceNoticeDays: 1,
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingLeaveType) {
      setFormData({
        name: editingLeaveType.name,
        annualAllocation: editingLeaveType.annualAllocation,
        requiresApproval: editingLeaveType.requiresApproval,
        adviceNoticeDays: editingLeaveType.adviceNoticeDays,
        isActive: editingLeaveType.isActive
      });
    } else {
      setFormData({
        name: '',
        annualAllocation: 20,
        requiresApproval: true,
        adviceNoticeDays: 1,
        isActive: true
      });
    }
  }, [editingLeaveType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a leave type name');
      return;
    }

    if (formData.annualAllocation <= 0) {
      toast.error('Annual allocation must be greater than 0');
      return;
    }

    if (formData.adviceNoticeDays < 0) {
      toast.error('Advice notice days must be 0 or greater');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const leaveTypeData = {
        ...formData
      };

      let result: LeaveType;
      
      if (editingLeaveType) {
        result = await leaveService.updateLeaveType(editingLeaveType.id, leaveTypeData);
        toast.success('Leave type updated successfully');
      } else {
        result = await leaveService.createLeaveType(leaveTypeData);
        toast.success('Leave type created successfully');
      }
      
      onSubmit(result);
      onClose();
    } catch (error: unknown) {
      console.error('Error saving leave type:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save leave type';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {editingLeaveType ? 'Edit Leave Type' : 'Create New Leave Type'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Annual Leave, Sick Leave, Personal Leave"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Annual Allocation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Allocation (Days) *
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.annualAllocation}
                onChange={(e) => setFormData({ ...formData, annualAllocation: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of days allocated per year for this leave type
              </p>
            </div>

            {/* Advice Notice Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Notice Days
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={formData.adviceNoticeDays}
                onChange={(e) => setFormData({ ...formData, adviceNoticeDays: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum days of advance notice required for this leave type
              </p>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Leave Type Settings</h3>
              
              <div className="space-y-3">
                {/* Requires Approval */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresApproval"
                    checked={formData.requiresApproval}
                    onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresApproval" className="ml-2 block text-sm text-gray-700">
                    Requires approval
                  </label>
                </div>

                {/* Is Active */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active (available for use)
                  </label>
                </div>
              </div>
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
                {isSubmitting ? 'Saving...' : (editingLeaveType ? 'Update Leave Type' : 'Create Leave Type')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveTypeForm;
