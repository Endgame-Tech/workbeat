import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import BiometricAttendance from '../BiometricAttendance';
import AttendanceTable from '../AttendanceTable';
import { Card, CardHeader, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Clock, Plus, List } from 'lucide-react';

const OrganizationAttendance: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [activeTab, setActiveTab] = useState<'records' | 'checkin'>('records');

  const handleComplete = () => {
    setActiveTab('records'); // Switch back to records view
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 dark:from-white dark:via-neutral-200 dark:to-white bg-clip-text text-transparent">
            Attendance Management
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            View attendance records and manage check-in/check-out
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'records' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('records')}
            leftIcon={<List size={16} />}
            size="sm"
          >
            Attendance Records
          </Button>
          <Button
            variant={activeTab === 'checkin' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('checkin')}
            leftIcon={<Plus size={16} />}
            size="sm"
          >
            Check In/Out
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'records' ? (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Clock className="mr-2" size={20} />
              Recent Attendance Records
            </h3>
          </CardHeader>
          <CardContent>
            <AttendanceTable
              organizationId={organizationId}
              isAdmin={true}
              allowPagination={true}
              allowDateFilter={true}
            />
          </CardContent>
        </Card>
      ) : (
        <BiometricAttendance onComplete={handleComplete} />
      )}
    </div>
  );
};

export default OrganizationAttendance;