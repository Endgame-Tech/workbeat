import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
// import Select from './ui/Select';
import { organizationService } from '../../services/organizationService';

interface OrganizationSettingsProps {
  organizationId: string;
}

const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({ organizationId }) => {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const data = await organizationService.getOrganization(organizationId);
        setOrganization(data);
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast.error('Failed to load organization details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganization();
  }, [organizationId]);

  const handleChange = (field: string, value: any) => {
    setOrganization((prev) => {
      // Handle nested fields with dot notation
      if (field.includes('.')) {
        const [parent, child, subchild] = field.split('.');
        
        if (subchild) {
          return {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: {
                ...prev[parent][child],
                [subchild]: value
              }
            }
          };
        }
        
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      
      // Handle regular fields
      return {
        ...prev,
        [field]: value
      };
    });
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const updatedData = await organizationService.updateOrganization(organizationId, organization);
      setOrganization(updatedData);
      toast.success('Organization settings updated successfully');
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Organization Settings
        </h2>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Organization Name"
              value={organization.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              required
            />
            
            <Input
              label="Contact Email"
              type="email"
              value={organization.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              error={errors.contactEmail}
              required
            />
            
            <Input
              label="Contact Phone"
              value={organization.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              error={errors.contactPhone}
              required
            />
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Working Hours
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Default Start Time"
                type="time"
                value={organization.settings.workingHours.default.start}
                onChange={(e) => handleChange('settings.workingHours.default.start', e.target.value)}
                error={errors['settings.workingHours.default.start']}
              />
              
              <Input
                label="Default End Time"
                type="time"
                value={organization.settings.workingHours.default.end}
                onChange={(e) => handleChange('settings.workingHours.default.end', e.target.value)}
                error={errors['settings.workingHours.default.end']}
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Grace Period (minutes)"
                type="number"
                min="0"
                max="60"
                value={organization.settings.gracePeriodsMinutes.toString()}
                onChange={(e) => handleChange('settings.gracePeriodsMinutes', parseInt(e.target.value))}
                error={errors['settings.gracePeriodsMinutes']}
              />
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Biometric Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireFingerprint"
                  checked={organization.settings.biometricRequirements.requireFingerprint}
                  onChange={(e) => handleChange('settings.biometricRequirements.requireFingerprint', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requireFingerprint" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Require Fingerprint Authentication
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireFacial"
                  checked={organization.settings.biometricRequirements.requireFacial}
                  onChange={(e) => handleChange('settings.biometricRequirements.requireFacial', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requireFacial" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                  Require Facial Recognition
                </label>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Appearance
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={organization.settings.primaryColor || '#3B82F6'}
                    onChange={(e) => handleChange('settings.primaryColor', e.target.value)}
                    className="h-10 w-10 border-0 rounded p-0"
                  />
                  <span className="ml-2 text-sm text-gray-500">
                    {organization.settings.primaryColor || '#3B82F6'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    value={organization.settings.secondaryColor || '#1E3A8A'}
                    onChange={(e) => handleChange('settings.secondaryColor', e.target.value)}
                    className="h-10 w-10 border-0 rounded p-0"
                  />
                  <span className="ml-2 text-sm text-gray-500">
                    {organization.settings.secondaryColor || '#1E3A8A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo URL
              </label>
              <Input
                type="text"
                placeholder="https://your-domain.com/logo.png"
                value={organization.settings.logoUrl || ''}
                onChange={(e) => handleChange('settings.logoUrl', e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a URL to your organization's logo (recommended size: 200x60px)
              </p>
            </div>
          </div>
        </form>
      </CardContent>
      
      <CardFooter>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          className="w-full"
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrganizationSettings;