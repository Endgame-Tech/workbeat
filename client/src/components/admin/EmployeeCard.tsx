
import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import type { Employee } from '../../types';

interface EmployeeCardProps {
  employee: Employee;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee }) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">{employee.name}</h3>
          <p className="text-sm text-gray-500">ID: {employee.employeeId}</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {employee.isActive ? 'Active' : 'Inactive'}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 mb-4">
          <p className="text-gray-600 dark:text-gray-300">{employee.email}</p>
          <p className="text-gray-600 dark:text-gray-300">{employee.department} - {employee.position}</p>
          <p className="text-gray-600 dark:text-gray-300">
            Status: <span className="font-medium">{employee.employmentStatus}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Hours: {employee.workingHours.start} - {employee.workingHours.end}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;