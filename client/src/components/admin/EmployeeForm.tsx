import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Save, X, Fingerprint, Camera } from 'lucide-react';
import FingerprintScanner from '../FingerprintScanner';
import FaceCapture from '../FaceCapture';
import { toast } from 'react-hot-toast';

// Add to interface props
interface EmployeeFormProps {
  employee?: Employee;
  onSubmit: (data: Partial<Employee>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  organizationId?: string; // Add this prop
}

const employmentStatusOptions = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contractor', label: 'Contractor' }
];

const accessLevelOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' }
];

const workDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

enum BiometricStep {
  NONE,
  FINGERPRINT,
  FACE
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel,
  isLoading
}) => {
  // Get organization ID from user in localStorage
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        if (userData.organizationId) {
          setOrganizationId(userData.organizationId);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const [formData, setFormData] = useState<Partial<Employee>>(
    employee || {
      organizationId: organizationId, // Set organization ID from context
      workSchedule: {
        days: [],
        hours: { start: '09:00', end: '17:00' }
      },
      workingHours: { start: '09:00', end: '17:00' },
      employmentStatus: 'full-time',
      accessLevel: 'employee',
      isActive: true,
      faceRecognition: {
        faceImages: []
      },
      biometrics: {
        fingerprint: {
          isEnrolled: false,
          credentialId: null
        }
      }
    }
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [biometricStep, setBiometricStep] = useState<BiometricStep>(BiometricStep.NONE);
  const [fingerprintEnrolled, setFingerprintEnrolled] = useState<boolean>(
    employee?.biometrics?.fingerprint?.isEnrolled || false
  );
  const [faceEnrolled, setFaceEnrolled] = useState<boolean>(
    employee?.faceRecognition?.faceImages?.length ? true : false
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Basic validation
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee ID is required';
    }
    
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.position) {
      newErrors.position = 'Position is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.employmentStatus) {
      newErrors.employmentStatus = 'Employment status is required';
    }
    
    if (!formData.accessLevel) {
      newErrors.accessLevel = 'Access level is required';
    }
    
    if (!formData.workSchedule?.days || formData.workSchedule.days.length === 0) {
      newErrors['workSchedule.days'] = 'At least one work day must be selected';
    }
    
    // Require face capture only, not fingerprint
    if (!employee && !faceEnrolled) {
      newErrors.faceCapture = 'Face capture is required for employee registration';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    // Get organization ID from localStorage
    try {
      // First check if user has organization object
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        
        // Check if it's in organization.id format
        if (userData.organization && userData.organization.id) {
          const orgId = userData.organization.id;
          console.log('Found organizationId from organization.id:', orgId);
          setOrganizationId(orgId);
          
          // Update formData with the organizationId
          setFormData(prev => ({
            ...prev,
            organizationId: orgId
          }));
          return; // Exit early since we found the ID
        }
        
        // Check if it's directly in the user object
        if (userData.organizationId) {
          console.log('Found organizationId in user data:', userData.organizationId);
          setOrganizationId(userData.organizationId);
          
          // Make sure it's in the form data too
          setFormData(prev => ({
            ...prev,
            organizationId: userData.organizationId
          }));
          return; // Exit early since we found the ID
        }
      }
      
      // If not found in user, check separate organization entry
      const orgString = localStorage.getItem('organization');
      if (orgString) {
        const orgData = JSON.parse(orgString);
        if (orgData.id) {
          console.log('Found organizationId in organization data:', orgData.id);
          setOrganizationId(orgData.id);
          
          // Update formData with the organizationId
          setFormData(prev => ({
            ...prev,
            organizationId: orgData.id
          }));
          return; // Exit early since we found the ID
        }
      }
      
      console.warn('No organizationId found in localStorage');
    } catch (error) {
      console.error('Error getting organizationId from localStorage:', error);
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Check for face enrollment if required
      if (!employee && !faceEnrolled) {
        toast.error('Please capture employee face before submitting');
        return;
      }
      
      // Make sure organizationId is included
      const dataToSubmit = { ...formData };
      
      // If organizationId is missing from form data, add it from state
      if (!dataToSubmit.organizationId && organizationId) {
        dataToSubmit.organizationId = organizationId;
        console.log('Added organizationId from state:', organizationId);
      }
      
      console.log('Submitting employee data with organizationId:', dataToSubmit.organizationId);
      
      // Submit the data
      onSubmit(dataToSubmit);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const toggleWorkDay = (day: string) => {
    const currentDays = formData.workSchedule?.days || [];
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];

    setFormData((prev) => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        days: updatedDays
      }
    }));
    
    // Clear work schedule days error if any days are selected
    if (updatedDays.length > 0 && errors['workSchedule.days']) {
      setErrors((prev) => ({
        ...prev,
        'workSchedule.days': ''
      }));
    }
  };

  const handleFingerprintSuccess = (credentialId?: string) => {
    setFingerprintEnrolled(true);
    setBiometricStep(BiometricStep.NONE);
    
    if (credentialId) {
      setFormData((prev) => ({
        ...prev,
        biometrics: {
          ...prev.biometrics,
          fingerprint: {
            isEnrolled: true,
            credentialId,
            enrolledAt: new Date().toISOString()
          }
        }
      }));
    }
    
    toast.success('Fingerprint enrolled successfully');
  };

  const handleFingerprintError = (error: string) => {
    toast.error(`Fingerprint enrollment failed: ${error}`);
  };

  const handleFaceCapture = (faceImage: string) => {
    setFaceEnrolled(true);
    setBiometricStep(BiometricStep.NONE);
    
    // Add the face image to the form data
    setFormData((prev) => ({
      ...prev,
      faceRecognition: {
        ...prev.faceRecognition,
        faceImages: [...(prev.faceRecognition?.faceImages || []), faceImage],
        lastUpdated: new Date().toISOString()
      }
    }));
    
    toast.success('Face captured successfully');
  };

  // Render biometric steps if active
  if (biometricStep === BiometricStep.FINGERPRINT) {
    return (
      <FingerprintScanner
        employeeId={employee?._id}
        employeeName={formData.name}
        onSuccess={handleFingerprintSuccess}
        onError={handleFingerprintError}
        onCancel={() => setBiometricStep(BiometricStep.NONE)}
        isEnrollment={true}
      />
    );
  }

  if (biometricStep === BiometricStep.FACE) {
    return (
      <FaceCapture
        onCapture={handleFaceCapture}
        onCancel={() => setBiometricStep(BiometricStep.NONE)}
        employeeName={formData.name}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">
          {employee ? 'Edit Employee' : 'Add New Employee'}
        </h2>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              required
            />
            
            <Input
              label="Employee ID"
              value={formData.employeeId || ''}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              error={errors.employeeId}
              required
            />
            
            <Input
              label="Email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              required
            />
            
            <Input
              label="Phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              error={errors.phone}
              required
            />
            
            <Input
              label="Department"
              value={formData.department || ''}
              onChange={(e) => handleChange('department', e.target.value)}
              error={errors.department}
              required
            />
            
            <Input
              label="Position"
              value={formData.position || ''}
              onChange={(e) => handleChange('position', e.target.value)}
              error={errors.position}
              required
            />
            
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              error={errors.startDate}
              required
            />
            
            <Select
              label="Employment Status"
              options={employmentStatusOptions}
              value={formData.employmentStatus || ''}
              onChange={(value) => handleChange('employmentStatus', value)}
              error={errors.employmentStatus}
              required
            />
            
            <Select
              label="Access Level"
              options={accessLevelOptions}
              value={formData.accessLevel || ''}
              onChange={(value) => handleChange('accessLevel', value)}
              error={errors.accessLevel}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Work Schedule
            </label>
            
            <div className="flex flex-wrap gap-2">
              {workDays.map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant={formData.workSchedule?.days?.includes(day) ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => toggleWorkDay(day)}
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
            
            {errors['workSchedule.days'] && (
              <p className="text-sm text-red-600">{errors['workSchedule.days']}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Work Hours Start"
              type="time"
              value={formData.workSchedule?.hours?.start || '09:00'}
              onChange={(e) =>
                handleChange('workSchedule', {
                  ...formData.workSchedule,
                  hours: { ...formData.workSchedule?.hours, start: e.target.value }
                })
              }
              error={errors['workSchedule.hours.start']}
              required
            />
            
            <Input
              label="Work Hours End"
              type="time"
              value={formData.workSchedule?.hours?.end || '17:00'}
              onChange={(e) =>
                handleChange('workSchedule', {
                  ...formData.workSchedule,
                  hours: { ...formData.workSchedule?.hours, end: e.target.value }
                })
              }
              error={errors['workSchedule.hours.end']}
              required
            />
          </div>
          
          {/* Biometric enrollment section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4">Biometric Enrollment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <Fingerprint className="mr-2 h-5 w-5 text-blue-500" />
                  <h4 className="text-md font-medium">Fingerprint (Optional)</h4>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {fingerprintEnrolled 
                    ? 'Fingerprint has been enrolled' 
                    : 'Optional: Enroll employee fingerprint for attendance verification'}
                </p>
                
                <Button
                  variant={fingerprintEnrolled ? 'ghost' : 'primary'}
                  onClick={() => setBiometricStep(BiometricStep.FINGERPRINT)}
                  disabled={!formData.name || !formData.employeeId}
                  className="w-full"
                >
                  {fingerprintEnrolled ? 'Re-enroll Fingerprint' : 'Enroll Fingerprint'}
                </Button>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <Camera className="mr-2 h-5 w-5 text-blue-500" />
                  <h4 className="text-md font-medium">Facial Recognition (Required)</h4>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {faceEnrolled 
                    ? 'Face has been captured' 
                    : 'Capture employee face for attendance verification'}
                </p>
                
                {errors.faceCapture && (
                  <p className="text-sm text-red-600 mb-2">{errors.faceCapture}</p>
                )}
                
                <Button
                  variant={faceEnrolled ? 'ghost' : 'primary'}
                  onClick={() => setBiometricStep(BiometricStep.FACE)}
                  disabled={!formData.name || !formData.employeeId}
                  className="w-full"
                >
                  {faceEnrolled ? 'Re-capture Face' : 'Capture Face'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          onClick={onCancel}
          leftIcon={<X size={18} />}
        >
          Cancel
        </Button>
        
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={isLoading}
          leftIcon={<Save size={18} />}
        >
          {employee ? 'Update Employee' : 'Add Employee'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EmployeeForm;