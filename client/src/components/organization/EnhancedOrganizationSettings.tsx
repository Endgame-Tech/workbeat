import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeProvider';
import {
  Settings,
  Building2,
  Clock,
  Users,
  Shield,
  Bell,
  Globe,
  Palette,
  FileText,
  MapPin,
  Calendar,
  AlertTriangle,
  Save,
  Plus,
  Trash2,
  Edit3,
} from 'lucide-react';
import { Card } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { organizationService } from '../../services/organizationService';

interface OrganizationSettingsProps {
  organizationId?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  headId?: string;
  parentId?: string;
  workingHours?: {
    start: string;
    end: string;
    breakStart?: string;
    breakEnd?: string;
  };
  isActive: boolean;
}




const EnhancedOrganizationSettings: React.FC<OrganizationSettingsProps> = ({ organizationId: propOrganizationId }) => {
  const { organizationId: paramOrganizationId } = useParams<{ organizationId: string }>();
  const organizationId = propOrganizationId || paramOrganizationId;
  const { updateBranding } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [organization, setOrganization] = useState<{
    name?: string;
    industry?: string;
    website?: string;
    registrationNumber?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    settings?: {
      appearance?: {
        logoUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        accentColor?: string;
        backgroundColor?: string;
        textColor?: string;
        borderColor?: string;
        darkModeEnabled?: boolean;
        customBranding?: boolean;
        companyName?: string;
      };
      attendancePolicy?: Record<string, unknown>;
      security?: Record<string, unknown>;
      notifications?: Record<string, unknown>;
      localization?: Record<string, unknown>;
      workingHours?: Record<string, unknown>;
      biometricRequirements?: Record<string, unknown>;
      integrations?: Record<string, unknown>;
    };
    [key: string]: unknown;
  } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [showAddDepartment, setShowAddDepartment] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: Building2 },
    { id: 'attendance', label: 'Attendance Policies', icon: Clock },
    { id: 'departments', label: 'Departments', icon: Users },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'localization', label: 'Localization', icon: Globe },
    { id: 'appearance', label: 'Branding', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Settings }
  ];

  // Memoized branding update function
  const updateBrandingMemo = useCallback((appearanceSettings: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    darkModeEnabled?: boolean;
    customBranding?: boolean;
    companyName?: string;
  }) => {
    updateBranding(appearanceSettings);
  }, [updateBranding]);

  // Separate useEffect for initial branding application
  useEffect(() => {
    if (organization?.settings?.appearance && !loading) {
      updateBrandingMemo(organization.settings.appearance);
    }
  }, [organization?.settings?.appearance, loading, updateBrandingMemo]);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) {
        console.warn('No organization ID available');
        setLoading(false);
        return;
      }
      
      try {
        const [orgData, settingsData, deptData] = await Promise.all([
          organizationService.getOrganization(organizationId),
          organizationService.getSettings(organizationId).catch(() => ({})), // Fallback to empty object if settings don't exist
          organizationService.getDepartments(organizationId).catch(() => []) // Fallback to empty array if departments don't exist
        ]);
        
        // Merge organization data with settings
        const mergedOrg = {
          ...orgData,
          settings: settingsData.settings || settingsData || {}
        };
        
        setOrganization(mergedOrg);
        setDepartments(deptData || [])
      } catch (error) {
        console.error('Error fetching organization data:', error);
        toast.error('Failed to load organization details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [organizationId]); // Removed updateBranding dependency to prevent re-fetching on branding changes

  const handleChange = (field: string, value: string | number | boolean | string[]) => {
    setOrganization((prev) => {
      if (!prev) return prev;
      if (field.includes('.')) {
        const keys = field.split('.');
        const newObj = JSON.parse(JSON.stringify(prev)); // Deep clone to avoid mutation issues
        let current = newObj;
        
        // Navigate to the nested object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        // Set the final value
        current[keys[keys.length - 1]] = value;
        
        // Apply branding changes in real-time for appearance settings
        if (field.startsWith('settings.appearance.')) {
          const appearanceSettings = newObj.settings?.appearance || {};
          
          // Delay the branding update to avoid state conflicts
          setTimeout(() => {
            updateBrandingMemo(appearanceSettings);
          }, 0);
        }
        
        return newObj;
      }
      
      return { ...prev, [field]: value };
    });
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (section: string) => {
    if (!organizationId) {
      toast.error('Organization ID not found');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // For settings sections, use the settings endpoint
      if (section.toLowerCase().includes('settings') || 
          section.toLowerCase().includes('policies') || 
          section.toLowerCase().includes('appearance') ||
          section.toLowerCase().includes('localization') ||
          section.toLowerCase().includes('notifications') ||
          section.toLowerCase().includes('security') ||
          section.toLowerCase().includes('advanced')) {
        const updatedData = await organizationService.updateSettings(organizationId, organization.settings || {});
        setOrganization((prev) => prev ? ({
          ...prev,
          settings: updatedData
        }) : null);
      } else {
        // For profile and other basic organization data
        const updatedData = await organizationService.updateOrganization(organizationId, organization);
        setOrganization(updatedData);
      }
      toast.success(`${section} settings updated successfully`);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error(`Failed to update ${section.toLowerCase()} settings`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!organizationId) {
      toast.error('Organization ID not found');
      return;
    }
    
    if (!newDepartment.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    try {
      const department = await organizationService.createDepartment(organizationId, newDepartment);
      setDepartments([...departments, department]);
      setNewDepartment({ name: '', description: '' });
      setShowAddDepartment(false);
      toast.success('Department created successfully');
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error('Failed to create department');
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!organizationId) {
      toast.error('Organization ID not found');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      await organizationService.deleteDepartment(organizationId, departmentId);
      setDepartments(departments.filter(d => d.id !== departmentId));
      toast.success('Department deleted successfully');
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const handleExportOrganizationData = async () => {
    if (!organizationId) {
      toast.error('Organization ID not found');
      return;
    }

    try {
      const data = await organizationService.exportData(organizationId, 'json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `organization-${organizationId}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Organization data exported successfully');
    } catch (error) {
      console.error('Error exporting organization data:', error);
      toast.error('Failed to export organization data');
    }
  };

  const handleConfigureHolidayCalendar = async () => {
    if (!organizationId) {
      toast.error('Organization ID not found');
      return;
    }

    try {
      const holidays = await organizationService.getHolidayCalendar(organizationId);
      // For now, show current holidays
      alert(`Current holidays: ${JSON.stringify(holidays, null, 2)}`);
      // TODO: Implement proper holiday calendar modal/form
      toast.info('Holiday calendar configuration opened');
    } catch (error) {
      console.error('Error fetching holiday calendar:', error);
      toast.error('Failed to open holiday calendar');
    }
  };

  const handleResetAllSettings = async () => {
    if (!organizationId) {
      toast.error('Organization ID not found');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to reset ALL organization settings to defaults? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const resetData = await organizationService.resetSettings(organizationId);
      setOrganization((prev) => prev ? ({
        ...prev,
        settings: resetData
      }) : null);
      toast.success('All settings reset to defaults successfully');
      // Reload the page to apply default branding
      window.location.reload();
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    }
  };

  const handleDeactivateOrganization = async () => {
    if (!organizationId) {
      toast.error('Organization ID not found');
      return;
    }

    const confirmed = window.confirm(
      'Are you ABSOLUTELY sure you want to deactivate this organization? This will:\n\n' +
      '• Disable all user access\n' +
      '• Stop all attendance tracking\n' +
      '• Preserve data but make it inaccessible\n' +
      '• Require admin intervention to reactivate\n\n' +
      'Type "DEACTIVATE" in the prompt to confirm.'
    );
    if (!confirmed) return;

    const confirmText = window.prompt('Type "DEACTIVATE" to confirm organization deactivation:');
    if (confirmText !== 'DEACTIVATE') {
      toast.error('Deactivation cancelled - confirmation text did not match');
      return;
    }

    try {
      await organizationService.updateOrganization(organizationId, { isActive: false });
      toast.success('Organization deactivated successfully');
      // Redirect to login or home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error deactivating organization:', error);
      toast.error('Failed to deactivate organization');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Organization ID not found. Please check the URL.</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Organization not found or access denied.</p>
      </div>
    );
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-6">
          <Building2 className="mr-3" size={24} />
          Company Information
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Organization Name"
              value={organization.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
            <Input
              label="Industry"
              value={organization.industry || ''}
              onChange={(e) => handleChange('industry', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Website"
              type="url"
              value={organization.website || ''}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://your-company.com"
            />
            <Input
              label="Registration Number"
              value={organization.registrationNumber || ''}
              onChange={(e) => handleChange('registrationNumber', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={4}
              value={organization.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Tell us about your company..."
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-6">
          <MapPin className="mr-3" size={24} />
          Contact & Address
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              value={organization.contactEmail || ''}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              required
            />
            <Input
              label="Contact Phone"
              value={organization.contactPhone || ''}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
            />
          </div>
          
          <Input
            label="Address"
            value={organization.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Full company address"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              value={organization.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
            />
            <Input
              label="State/Province"
              value={organization.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
            />
            <Input
              label="Postal Code"
              value={organization.postalCode || ''}
              onChange={(e) => handleChange('postalCode', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-6">
          <Clock className="mr-3" size={24} />
          Attendance Policies
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Grace Period (minutes)"
              type="number"
              min="0"
              max="60"
              value={organization.settings?.attendancePolicy?.gracePeriodsMinutes?.toString() || '15'}
              onChange={(e) => handleChange('settings.attendancePolicy.gracePeriodsMinutes', parseInt(e.target.value))}
            />
            <Input
              label="Late Threshold (minutes)"
              type="number"
              min="1"
              max="120"
              value={organization.settings?.attendancePolicy?.lateThresholdMinutes?.toString() || '30'}
              onChange={(e) => handleChange('settings.attendancePolicy.lateThresholdMinutes', parseInt(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Minimum Hours per Day"
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={organization.settings?.attendancePolicy?.minimumHoursPerDay?.toString() || '8'}
              onChange={(e) => handleChange('settings.attendancePolicy.minimumHoursPerDay', parseFloat(e.target.value))}
            />
            <Input
              label="Maximum Hours per Day"
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={organization.settings?.attendancePolicy?.maximumHoursPerDay?.toString() || '12'}
              onChange={(e) => handleChange('settings.attendancePolicy.maximumHoursPerDay', parseFloat(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Default Start Time"
              type="time"
              value={organization.settings?.workingHours?.default?.start || '09:00'}
              onChange={(e) => handleChange('settings.workingHours.default.start', e.target.value)}
            />
            <Input
              label="Default End Time"
              type="time"
              value={organization.settings?.workingHours?.default?.end || '17:00'}
              onChange={(e) => handleChange('settings.workingHours.default.end', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Break Start Time"
              type="time"
              value={organization.settings?.workingHours?.default?.breakStart || '12:00'}
              onChange={(e) => handleChange('settings.workingHours.default.breakStart', e.target.value)}
            />
            <Input
              label="Break End Time"
              type="time"
              value={organization.settings?.workingHours?.default?.breakEnd || '13:00'}
              onChange={(e) => handleChange('settings.workingHours.default.breakEnd', e.target.value)}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-md font-medium mb-4">Policy Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="strictWorkingHours"
                  checked={organization.settings?.attendancePolicy?.strictWorkingHours || false}
                  onChange={(e) => handleChange('settings.attendancePolicy.strictWorkingHours', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="strictWorkingHours" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Enforce strict working hours
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowEarlyDeparture"
                  checked={organization.settings?.attendancePolicy?.allowEarlyDeparture || false}
                  onChange={(e) => handleChange('settings.attendancePolicy.allowEarlyDeparture', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allowEarlyDeparture" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Allow early departure
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresApprovalForOvertime"
                  checked={organization.settings?.attendancePolicy?.requiresApprovalForOvertime || false}
                  onChange={(e) => handleChange('settings.attendancePolicy.requiresApprovalForOvertime', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requiresApprovalForOvertime" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Require approval for overtime
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDepartmentsTab = () => (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
            <Users className="mr-3" size={24} />
            Department Management
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddDepartment(true)}
            leftIcon={<Plus size={16} />}
            className="rounded-xl"
          >
            Add Department
          </Button>
        </div>
        <div>
          {showAddDepartment && (
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h4 className="text-md font-medium mb-3">Add New Department</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Department Name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  placeholder="e.g., Engineering, Marketing"
                />
                <Input
                  label="Description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="primary" size="sm" onClick={handleAddDepartment} className="rounded-xl">
                  Create Department
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddDepartment(false)} className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {departments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No departments created yet. Add your first department above.
              </div>
            ) : (
              departments.map((department) => (
                <div key={department.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-medium text-gray-900 dark:text-white">{department.name}</h4>
                        <Badge
                          type={department.isActive ? 'success' : 'warning'}
                          text={department.isActive ? 'Active' : 'Inactive'}
                          size="sm"
                        />
                      </div>
                      {department.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{department.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" leftIcon={<Edit3 size={14} />} className="rounded-xl">
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDepartment(department.id)}
                        leftIcon={<Trash2 size={14} />}
                        className="text-red-600 hover:text-red-700 rounded-xl"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-6">
          <Shield className="mr-3" size={24} />
          Security & Access Control
        </h3>
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">IP Access Control</h4>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="ipWhitelistEnabled"
                checked={organization.settings?.security?.ipWhitelistEnabled || false}
                onChange={(e) => handleChange('settings.security.ipWhitelistEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="ipWhitelistEnabled" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                Enable IP whitelisting
              </label>
            </div>
            {organization.settings?.security?.ipWhitelistEnabled && (
              <Input
                label="Allowed IP Addresses (comma-separated)"
                value={organization.settings?.security?.allowedIPs?.join(', ') || ''}
                onChange={(e) => handleChange('settings.security.allowedIPs', e.target.value.split(',').map((ip: string) => ip.trim()))}
                placeholder="192.168.1.1, 10.0.0.1"
              />
            )}
          </div>

          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">Geofencing</h4>
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="geofencingEnabled"
                checked={organization.settings?.security?.geofencingEnabled || false}
                onChange={(e) => handleChange('settings.security.geofencingEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="geofencingEnabled" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                Enable location-based attendance
              </label>
            </div>
            {organization.settings?.security?.geofencingEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  step="any"
                  value={organization.settings?.security?.geofenceLatitude?.toString() || ''}
                  onChange={(e) => handleChange('settings.security.geofenceLatitude', parseFloat(e.target.value))}
                />
                <Input
                  label="Longitude"
                  type="number"
                  step="any"
                  value={organization.settings?.security?.geofenceLongitude?.toString() || ''}
                  onChange={(e) => handleChange('settings.security.geofenceLongitude', parseFloat(e.target.value))}
                />
                <Input
                  label="Radius (meters)"
                  type="number"
                  min="10"
                  max="5000"
                  value={organization.settings?.security?.geofenceRadius?.toString() || '100'}
                  onChange={(e) => handleChange('settings.security.geofenceRadius', parseInt(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">Session Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Session Timeout (minutes)"
                type="number"
                min="5"
                max="1440"
                value={organization.settings?.security?.sessionTimeoutMinutes?.toString() || '480'}
                onChange={(e) => handleChange('settings.security.sessionTimeoutMinutes', parseInt(e.target.value))}
              />
              <Input
                label="Max Concurrent Sessions"
                type="number"
                min="1"
                max="10"
                value={organization.settings?.security?.maxConcurrentSessions?.toString() || '2'}
                onChange={(e) => handleChange('settings.security.maxConcurrentSessions', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">Authentication & Passwords</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="twoFactorRequired"
                  checked={organization.settings?.security?.twoFactorRequired || false}
                  onChange={(e) => handleChange('settings.security.twoFactorRequired', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="twoFactorRequired" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Require two-factor authentication
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requirePasswordChange"
                  checked={organization.settings?.security?.requirePasswordChange || false}
                  onChange={(e) => handleChange('settings.security.requirePasswordChange', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requirePasswordChange" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Force password change on first login
                </label>
              </div>
            </div>

            {organization.settings?.security?.requirePasswordChange && (
              <div className="mt-4">
                <Input
                  label="Password Expiry (days)"
                  type="number"
                  min="30"
                  max="365"
                  value={organization.settings?.security?.passwordExpiryDays?.toString() || '90'}
                  onChange={(e) => handleChange('settings.security.passwordExpiryDays', parseInt(e.target.value))}
                />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-md font-medium mb-3">Biometric Security</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireFingerprint"
                  checked={organization.settings?.biometricRequirements?.requireFingerprint || false}
                  onChange={(e) => handleChange('settings.biometricRequirements.requireFingerprint', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requireFingerprint" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Require fingerprint authentication
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireFacial"
                  checked={organization.settings?.biometricRequirements?.requireFacial || false}
                  onChange={(e) => handleChange('settings.biometricRequirements.requireFacial', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requireFacial" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Require facial recognition
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-6">
          <Bell className="mr-3" size={24} />
          Notification Preferences
        </h3>
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">General Notifications</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={organization.settings?.notifications?.emailNotifications || false}
                  onChange={(e) => handleChange('settings.notifications.emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Email notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smsNotifications"
                  checked={organization.settings?.notifications?.smsNotifications || false}
                  onChange={(e) => handleChange('settings.notifications.smsNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="smsNotifications" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  SMS notifications
                </label>
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">Attendance Alerts</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lateArrivalAlerts"
                  checked={organization.settings?.notifications?.lateArrivalAlerts || false}
                  onChange={(e) => handleChange('settings.notifications.lateArrivalAlerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="lateArrivalAlerts" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Late arrival alerts
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="absenceAlerts"
                  checked={organization.settings?.notifications?.absenceAlerts || false}
                  onChange={(e) => handleChange('settings.notifications.absenceAlerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="absenceAlerts" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Absence alerts
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="overtimeAlerts"
                  checked={organization.settings?.notifications?.overtimeAlerts || false}
                  onChange={(e) => handleChange('settings.notifications.overtimeAlerts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="overtimeAlerts" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Overtime alerts
                </label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium mb-3">Reports</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="weeklyReports"
                  checked={organization.settings?.notifications?.weeklyReports || false}
                  onChange={(e) => handleChange('settings.notifications.weeklyReports', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="weeklyReports" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Weekly summary reports
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="monthlyReports"
                  checked={organization.settings?.notifications?.monthlyReports || false}
                  onChange={(e) => handleChange('settings.notifications.monthlyReports', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="monthlyReports" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Monthly performance reports
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocalizationTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-6">
          <Globe className="mr-3" size={24} />
          Localization Settings
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Zone
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={organization.settings?.localization?.timezone || 'UTC'}
                onChange={(e) => handleChange('settings.localization.timezone', e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
                <option value="Asia/Kolkata">India</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Format
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={organization.settings?.localization?.dateFormat || 'MM/DD/YYYY'}
                onChange={(e) => handleChange('settings.localization.dateFormat', e.target.value)}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Format
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={organization.settings?.localization?.timeFormat || '12'}
                onChange={(e) => handleChange('settings.localization.timeFormat', e.target.value)}
              >
                <option value="12">12-hour (AM/PM)</option>
                <option value="24">24-hour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={organization.settings?.localization?.currency || 'USD'}
                onChange={(e) => handleChange('settings.localization.currency', e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Week Start Day
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={organization.settings?.localization?.weekStartDay || 'monday'}
              onChange={(e) => handleChange('settings.localization.weekStartDay', e.target.value)}
            >
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-6">
          <Palette className="mr-3" size={24} />
          Branding & Appearance
        </h3>
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">Company Branding</h4>
            <div className="space-y-4">
              <Input
                label="Company Display Name"
                value={organization.settings?.appearance?.companyName || organization.name || ''}
                onChange={(e) => handleChange('settings.appearance.companyName', e.target.value)}
                placeholder="Your Company Name"
              />
              <Input
                label="Logo URL"
                type="url"
                value={organization.settings?.appearance?.logoUrl || ''}
                onChange={(e) => handleChange('settings.appearance.logoUrl', e.target.value)}
                placeholder="https://your-domain.com/logo.png"
              />
              <p className="text-xs text-gray-500">
                Recommended: 200x60px PNG/SVG with transparent background
              </p>
            </div>
          </div>

          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">Complete Color Scheme</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Brand Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={organization.settings?.appearance?.primaryColor || '#3B82F6'}
                    onChange={(e) => handleChange('settings.appearance.primaryColor', e.target.value)}
                    className="h-10 w-16 border-0 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    {organization.settings?.appearance?.primaryColor || '#3B82F6'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Buttons, links, highlights</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={organization.settings?.appearance?.secondaryColor || '#1E3A8A'}
                    onChange={(e) => handleChange('settings.appearance.secondaryColor', e.target.value)}
                    className="h-10 w-16 border-0 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    {organization.settings?.appearance?.secondaryColor || '#1E3A8A'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Headers, navigation</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={organization.settings?.appearance?.accentColor || '#10B981'}
                    onChange={(e) => handleChange('settings.appearance.accentColor', e.target.value)}
                    className="h-10 w-16 border-0 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    {organization.settings?.appearance?.accentColor || '#10B981'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Success states, icons</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={organization.settings?.appearance?.backgroundColor || '#FFFFFF'}
                    onChange={(e) => handleChange('settings.appearance.backgroundColor', e.target.value)}
                    className="h-10 w-16 border-0 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    {organization.settings?.appearance?.backgroundColor || '#FFFFFF'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Main background</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={organization.settings?.appearance?.textColor || '#1F2937'}
                    onChange={(e) => handleChange('settings.appearance.textColor', e.target.value)}
                    className="h-10 w-16 border-0 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    {organization.settings?.appearance?.textColor || '#1F2937'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Body text, headings</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Border Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={organization.settings?.appearance?.borderColor || '#E5E7EB'}
                    onChange={(e) => handleChange('settings.appearance.borderColor', e.target.value)}
                    className="h-10 w-16 border-0 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    {organization.settings?.appearance?.borderColor || '#E5E7EB'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Cards, dividers, inputs</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-medium mb-3">Custom Themes</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="darkModeEnabled"
                  checked={organization.settings?.appearance?.darkModeEnabled || false}
                  onChange={(e) => handleChange('settings.appearance.darkModeEnabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="darkModeEnabled" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Enable dark mode support
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="customBranding"
                  checked={organization.settings?.appearance?.customBranding || false}
                  onChange={(e) => handleChange('settings.appearance.customBranding', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="customBranding" className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  Apply custom branding across all pages
                </label>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium mb-3">Live Preview</h4>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {organization.settings?.appearance?.logoUrl ? (
                    <img 
                      src={organization.settings.appearance.logoUrl} 
                      alt="Logo Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">WB</span>
                </div>
                <span className="text-sm font-medium">Organization Name</span>
              </div>
              <div className="flex space-x-2">
                <div 
                  className="btn-primary px-3 py-1 rounded text-sm text-white"
                  style={{
                    backgroundColor: organization.settings?.appearance?.primaryColor || '#3B82F6'
                  }}
                >
                  Primary Button
                </div>
                <div 
                  className="btn-outline-primary px-3 py-1 rounded text-sm border-2"
                  style={{
                    color: organization.settings?.appearance?.primaryColor || '#3B82F6',
                    borderColor: organization.settings?.appearance?.primaryColor || '#3B82F6'
                  }}
                >
                  Outline Button
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This is how your branding will appear throughout the application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center mb-6">
          <Settings className="mr-3" size={24} />
          Advanced Settings
        </h3>
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">Data Management</h4>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                leftIcon={<FileText size={16} />}
                onClick={handleExportOrganizationData}
                className="w-full justify-start"
              >
                Export Organization Data
              </Button>
              <Button 
                variant="outline" 
                leftIcon={<Calendar size={16} />}
                onClick={handleConfigureHolidayCalendar}
                className="w-full justify-start"
              >
                Configure Holiday Calendar
              </Button>
            </div>
          </div>

          <div className="border-b pb-4">
            <h4 className="text-md font-medium mb-3">Integration Settings</h4>
            <div className="space-y-4">
              <Input
                label="API Key"
                type="password"
                value={organization.settings?.integrations?.apiKey || ''}
                onChange={(e) => handleChange('settings.integrations.apiKey', e.target.value)}
                placeholder="Your API key for integrations"
              />
              <Input
                label="Webhook URL"
                type="url"
                value={organization.settings?.integrations?.webhookUrl || ''}
                onChange={(e) => handleChange('settings.integrations.webhookUrl', e.target.value)}
                placeholder="https://your-domain.com/webhook"
              />
            </div>
          </div>

          <div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
            <h4 className="text-md font-medium mb-3 text-red-800 dark:text-red-200 flex items-center">
              <AlertTriangle size={16} className="mr-2" />
              Danger Zone
            </h4>
            <div className="space-y-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                These actions are irreversible. Please proceed with caution.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={handleResetAllSettings}
                >
                  Reset All Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={handleDeactivateOrganization}
                >
                  Deactivate Organization
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent">
            Organization Settings
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-lg">
            Manage your organization's configuration, policies, and preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(tabs.find(t => t.id === activeTab)?.label || 'Settings')}
            isLoading={isSubmitting}
            leftIcon={<Save size={16} />}
            className="rounded-xl"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Card variant="elevated" className="overflow-hidden">
        <div className="flex flex-wrap gap-2 p-6 border-b border-neutral-200 dark:border-neutral-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'attendance' && renderAttendanceTab()}
          {activeTab === 'departments' && renderDepartmentsTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'localization' && renderLocalizationTab()}
          {activeTab === 'appearance' && renderAppearanceTab()}
          {activeTab === 'advanced' && renderAdvancedTab()}
        </div>
      </Card>
    </div>
  );
};

export default EnhancedOrganizationSettings;