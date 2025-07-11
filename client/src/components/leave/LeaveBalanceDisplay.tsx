import React from 'react';
import { Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { LeaveBalance, LeaveType, Employee } from '../../types';

interface LeaveBalanceDisplayProps {
  balances: LeaveBalance[];
  leaveTypes: LeaveType[];
  employees: Employee[];
  employeeId?: number;
  showEmployeeNames?: boolean;
}

const LeaveBalanceDisplay: React.FC<LeaveBalanceDisplayProps> = ({
  balances,
  leaveTypes,
  employees,
  employeeId,
  showEmployeeNames = false
}) => {
  const getEmployeeName = (empId: number) => {
    const employee = employees.find(emp => emp.id === empId);
    return employee ? employee.name : 'Unknown Employee';
  };

  const getLeaveType = (leaveTypeId: number) => {
    return leaveTypes.find(lt => lt.id === leaveTypeId);
  };

  const filteredBalances = employeeId 
    ? balances.filter(balance => balance.employeeId === employeeId)
    : balances;

  const groupedBalances = filteredBalances.reduce((acc, balance) => {
    const key = showEmployeeNames ? balance.employeeId : balance.leaveTypeId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(balance);
    return acc;
  }, {} as Record<number, LeaveBalance[]>);

  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (filteredBalances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Balances
          </h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No leave balances found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Leave Balances ({new Date().getFullYear()})
        </h3>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedBalances).map(([key, balances]) => {
            if (showEmployeeNames) {
              const employeeId = parseInt(key);
              const employeeName = getEmployeeName(employeeId);
              
              return (
                <div key={key} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {employeeName}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {balances.map((balance) => {
                      const leaveType = getLeaveType(balance.leaveTypeId);
                      const usagePercentage = getUsagePercentage(balance.usedDays, balance.totalDays);
                      
                      return (
                        <div key={balance.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: leaveType?.color || '#6B7280' }}
                              />
                              <span className="font-medium text-sm">
                                {leaveType?.name || 'Unknown Type'}
                              </span>
                            </div>
                            
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(usagePercentage)}`}>
                              {usagePercentage}%
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium">{balance.totalDays} days</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600">Used:</span>
                              <span className="text-red-600 font-medium">{balance.usedDays} days</span>
                            </div>
                            
                            {balance.pendingDays > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Pending:</span>
                                <span className="text-orange-600 font-medium">{balance.pendingDays} days</span>
                              </div>
                            )}
                            
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-gray-600">Remaining:</span>
                              <span className="text-green-600 font-medium">{balance.remainingDays} days</span>
                            </div>
                            
                            {balance.carryOverDays > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Carry Over:</span>
                                <span className="text-blue-600 font-medium">{balance.carryOverDays} days</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${usagePercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            } else {
              // Group by leave type
              const leaveTypeId = parseInt(key);
              const leaveType = getLeaveType(leaveTypeId);
              
              return (
                <div key={key} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: leaveType?.color || '#6B7280' }}
                    />
                    {leaveType?.name || 'Unknown Type'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {balances.map((balance) => {
                      const employeeName = getEmployeeName(balance.employeeId);
                      const usagePercentage = getUsagePercentage(balance.usedDays, balance.totalDays);
                      
                      return (
                        <div key={balance.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{employeeName}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(usagePercentage)}`}>
                              {usagePercentage}%
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium">{balance.totalDays} days</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-600">Used:</span>
                              <span className="text-red-600 font-medium">{balance.usedDays} days</span>
                            </div>
                            
                            {balance.pendingDays > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Pending:</span>
                                <span className="text-orange-600 font-medium">{balance.pendingDays} days</span>
                              </div>
                            )}
                            
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-gray-600">Remaining:</span>
                              <span className="text-green-600 font-medium">{balance.remainingDays} days</span>
                            </div>
                            
                            {balance.carryOverDays > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Carry Over:</span>
                                <span className="text-blue-600 font-medium">{balance.carryOverDays} days</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${usagePercentage}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Warnings */}
                          {balance.remainingDays <= 2 && balance.remainingDays > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>Low balance</span>
                            </div>
                          )}
                          
                          {balance.remainingDays === 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>No remaining days</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          })}
        </div>
        
        {/* Summary Statistics */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredBalances.reduce((sum, balance) => sum + balance.totalDays, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Allocated</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredBalances.reduce((sum, balance) => sum + balance.usedDays, 0)}
              </div>
              <div className="text-sm text-gray-600">Days Used</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredBalances.reduce((sum, balance) => sum + balance.pendingDays, 0)}
              </div>
              <div className="text-sm text-gray-600">Pending Requests</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredBalances.reduce((sum, balance) => sum + balance.remainingDays, 0)}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceDisplay;
