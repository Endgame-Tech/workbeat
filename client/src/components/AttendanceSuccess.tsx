// Fixed AttendanceSuccess.tsx to properly display late status

import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';
import { formatDate, formatTime } from '../utils/attendanceUtils';

interface AttendanceSuccessProps {
  type: 'sign-in' | 'sign-out';
  timestamp: string;
  employeeName: string;
  isLate: boolean;
  onDone: () => void;
}

const AttendanceSuccess: React.FC<AttendanceSuccessProps> = ({ 
  type, 
  timestamp, 
  employeeName, 
  isLate, 
  onDone 
}) => {
  // IMPORTANT: Force isLate to be a boolean to avoid any type issues
  const isEmployeeLate = Boolean(isLate);
  

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center pb-0">
        <div className="mx-auto mb-4">
          {type === 'sign-in' && !isEmployeeLate && (
            <CheckCircle size={64} className="text-green-500" />
          )}
          {type === 'sign-in' && isEmployeeLate && (
            <AlertTriangle size={64} className="text-amber-500" />
          )}
          {type === 'sign-out' && (
            <Clock size={64} className="text-blue-500" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {type === 'sign-in' ? (
            isEmployeeLate ? 'Late Arrival' : 'Signed In Successfully'
          ) : (
            'Signed Out Successfully'
          )}
        </h2>
      </CardHeader>
      
      <CardContent className="pt-4 pb-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Employee:</strong> {employeeName}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Time:</strong> {formatTime(timestamp)}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Date:</strong> {formatDate(timestamp)}
          </p>
          {type === 'sign-in' && (
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Status:</strong>{' '}
              <span className={isEmployeeLate ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}>
                {isEmployeeLate ? 'Late' : 'On Time'}
              </span>
            </p>
          )}
        </div>
        
        {type === 'sign-in' && isEmployeeLate && (
          <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              Your arrival has been recorded as late. If you believe this is an error, 
              please contact your supervisor.
            </p>
          </div>
        )}
        
        {type === 'sign-in' && !isEmployeeLate && (
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-200 text-sm">
              You've been checked in successfully. Have a great day!
            </p>
          </div>
        )}
        
        {type === 'sign-out' && (
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              You've been checked out successfully. See you next time!
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button variant="primary" className="w-full" onClick={onDone}>
          Done
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttendanceSuccess;