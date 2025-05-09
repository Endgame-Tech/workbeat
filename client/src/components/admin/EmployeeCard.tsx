import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';


interface EmployeeCardProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onEdit }) => {
  const [currentEmployee, setCurrentEmployee] = useState<Employee>(employee);


  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">{currentEmployee.name}</h3>
          <p className="text-sm text-gray-500">ID: {currentEmployee.employeeId}</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          currentEmployee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {currentEmployee.isActive ? 'Active' : 'Inactive'}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1 mb-4">
          <p className="text-gray-600 dark:text-gray-300">{currentEmployee.email}</p>
          <p className="text-gray-600 dark:text-gray-300">{currentEmployee.department} - {currentEmployee.position}</p>
          <p className="text-gray-600 dark:text-gray-300">
            Status: <span className="font-medium">{currentEmployee.employmentStatus}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Hours: {currentEmployee.workingHours.start} - {currentEmployee.workingHours.end}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeCard;