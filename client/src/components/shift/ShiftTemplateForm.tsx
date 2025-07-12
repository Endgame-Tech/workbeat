import React, { useState, useEffect } from 'react';
import { shiftService } from '../../services/shiftService';
import { ShiftTemplate } from '../../types';

interface ShiftTemplateFormProps {
  shiftTemplate?: ShiftTemplate;
  onSave: (shiftTemplate: ShiftTemplate) => void;
  onCancel: () => void;
}

export const ShiftTemplateForm: React.FC<ShiftTemplateFormProps> = ({
  shiftTemplate,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    breakDuration: 0,
    daysOfWeek: [] as string[],
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shiftTemplate) {
      setFormData({
        name: shiftTemplate.name,
        startTime: shiftTemplate.startTime,
        endTime: shiftTemplate.endTime,
        breakDuration: shiftTemplate.breakDuration,
        daysOfWeek: shiftTemplate.daysOfWeek,
        isActive: shiftTemplate.isActive
      });
    }
  }, [shiftTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let savedTemplate: ShiftTemplate;
      
      if (shiftTemplate?.id) {
        savedTemplate = await shiftService.updateShiftTemplate(shiftTemplate.id, formData);
      } else {
        savedTemplate = await shiftService.createShiftTemplate(formData);
      }
      
      onSave(savedTemplate);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save shift template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  const dayNames = [
    { name: 'Monday', value: 'monday' },
    { name: 'Tuesday', value: 'tuesday' },
    { name: 'Wednesday', value: 'wednesday' },
    { name: 'Thursday', value: 'thursday' },
    { name: 'Friday', value: 'friday' },
    { name: 'Saturday', value: 'saturday' },
    { name: 'Sunday', value: 'sunday' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {shiftTemplate ? 'Edit Shift Template' : 'Create Shift Template'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days of Week *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {dayNames.map((day) => (
              <label key={day.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.daysOfWeek.includes(day.value)}
                  onChange={() => handleDayToggle(day.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{day.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Break Duration (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={formData.breakDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Active Template
          </label>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || formData.daysOfWeek.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Template'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
