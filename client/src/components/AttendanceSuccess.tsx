import React from 'react';
import { formatTime } from '../utils/attendanceUtils';
import { Card, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import { CheckCircle } from 'lucide-react';

interface AttendanceSuccessProps {
  type: 'sign-in' | 'sign-out';
  timestamp: string;
  employeeName: string;
  isLate?: boolean;
  onDone: () => void;
}

const AttendanceSuccess: React.FC<AttendanceSuccessProps> = ({
  type,
  timestamp,
  employeeName,
  isLate,
  onDone
}) => {
  const time = formatTime(timestamp);
  const date = new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isLate ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
            <CheckCircle size={32} />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {type === 'sign-in' ? 'Signed In Successfully' : 'Signed Out Successfully'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300">
            {employeeName}
          </p>
          
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 w-full">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Time:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{time}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Date:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{date}</span>
            </div>
          </div>
          
          {isLate && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-200">
              <p className="text-sm">You've been marked as late today.</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="primary"
          onClick={onDone}
        >
          Done
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttendanceSuccess;