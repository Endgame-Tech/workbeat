// Updated AttendanceTable.tsx with improved image handling and department fix (continued)
import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Employee } from '../types';
import { formatTime, formatDate } from '../utils/attendanceUtils';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Clock, MapPin, ArrowDown, ArrowUp, Search, RefreshCw } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { toast } from 'react-hot-toast';
import Badge from './ui/Badge';

interface AttendanceTableProps {
  records?: AttendanceRecord[];
  isAdmin?: boolean;
  organizationId?: string; // Optional prop to override the organization ID
  onRefresh?: () => void; // Optional callback for when the refresh button is clicked
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ 
  records: initialRecords, 
  isAdmin = false,
  organizationId: propOrgId,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'timestamp' | 'employeeId'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'sign-in' | 'sign-out'>('all');
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords || []);
  const [employees, setEmployees] = useState<Record<string, Employee>>({});
  const [loading, setLoading] = useState(!initialRecords);
  const [refreshing, setRefreshing] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(propOrgId || null);
  const [organizationName, setOrganizationName] = useState<string>('');

  // Get the organization ID on mount if not provided as a prop
  useEffect(() => {
    if (!organizationId) {
      const orgId = employeeService.getCurrentOrganizationId();
      setOrganizationId(orgId);
      
      // Try to get organization name from localStorage
      try {
        const userString = localStorage.getItem('user');
        if (userString) {
          const userData = JSON.parse(userString);
          if (userData.organizationName) {
            setOrganizationName(userData.organizationName);
          }
        }
      } catch (error) {
        console.error('Error getting organization name:', error);
      }
    }
  }, [organizationId, propOrgId]);

  // Update records when initialRecords prop changes
  useEffect(() => {
    if (initialRecords) {
      setRecords(initialRecords);
      setLoading(false);
    }
  }, [initialRecords]);

  // Fetch records and employees from database if not provided as props
  useEffect(() => {
    if (!initialRecords && organizationId) {
      // Only fetch records if we have an organization ID and no initial records
      fetchAttendanceRecords();
    }
    
    // Only fetch employees if we have an organization ID
    if (organizationId) {
      fetchEmployees();
    }
  }, [initialRecords, organizationId]);

  // Function to fetch attendance records for the current organization
  const fetchAttendanceRecords = async () => {
    if (!organizationId) {
      console.warn('Cannot fetch attendance records: No organization ID available');
      return;
    }
    
    setLoading(true);
    try {
      const data = await attendanceService.getAllAttendanceRecords(100);
      console.log(`Fetched ${data.length} attendance records for organization ${organizationId}`);
      setRecords(data);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to fetch employees for the current organization
  const fetchEmployees = async () => {
    if (!organizationId) {
      console.warn('Cannot fetch employees: No organization ID available');
      return;
    }
    
    try {
      const data = await employeeService.getAllEmployees();
      
      // Transform into a lookup map for easier access by ID
      const employeeMap: Record<string, Employee> = {};
      data.forEach(employee => {
        // Map by all possible ID forms for better matching
        if (employee.id) employeeMap[String(employee.id)] = employee;
        if (employee._id) employeeMap[employee._id] = employee;
        if (employee.employeeId) employeeMap[employee.employeeId] = employee;
      });
      
      console.log(`Loaded ${data.length} employees for organization ${organizationId}`);
      setEmployees(employeeMap);
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to load employee data');
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    setRefreshing(true);
    
    // If parent component provided an onRefresh callback, use it
    if (onRefresh) {
      onRefresh();
      setTimeout(() => setRefreshing(false), 500); // ensure the refresh icon spins for at least 500ms
    } else {
      // Otherwise, do our own refresh
      fetchAttendanceRecords();
      fetchEmployees();
    }
  };
  
  // Sort and filter records
  const filteredRecords = records
    .filter(record => {
      // Filter by organization ID (extra check in case records from multiple orgs were provided)
      if (organizationId && record.organizationId && record.organizationId !== organizationId) {
        return false;
      }
      
      // Filter by type
      if (filter !== 'all' && record.type !== filter) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm === '') {
        return true;
      }
      
      const employee = employees[record.employeeId];
      
      return employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             employee?.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (record.employeeName && record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));
    })
    .sort((a, b) => {
      if (sortField === 'timestamp') {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      } else {
        return sortDirection === 'asc'
          ? String(a.employeeId).localeCompare(String(b.employeeId))
          : String(b.employeeId).localeCompare(String(a.employeeId));
      }
    });
  
  const handleSort = (field: 'timestamp' | 'employeeId') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getEmployeeName = (employeeId: string, recordEmployeeName?: string): string => {
    // First use the employee data from our map if available
    if (employees[employeeId]?.name) {
      return employees[employeeId].name;
    }
    
    // If not available, use the employee name stored in the record
    if (recordEmployeeName) {
      return recordEmployeeName;
    }
    
    // Fallback
    return 'Unknown Employee';
  };
  
  // Fixed function to never show "Unknown Department"
  const getEmployeeDepartment = (employeeId: string): string => {
    return employees[employeeId]?.department || '';
  };
  
  // Helper to extract image from different possible sources
  const getEmployeeImage = (record: AttendanceRecord): string | null => {
    // First priority: Check facial capture from the record
    if (record.facialCapture && record.facialCapture.image) {
      return record.facialCapture.image;
    }
    
    // Second priority: Get employee from the map and check for face recognition images
    const employee = employees[record.employeeId];
    if (employee) {
      // Check for faceRecognition field
      if (employee.faceRecognition) {
        // Handle string or object format
        const faceData = typeof employee.faceRecognition === 'string'
          ? JSON.parse(employee.faceRecognition)
          : employee.faceRecognition;
          
        if (faceData.faceImages && faceData.faceImages.length > 0) {
          return faceData.faceImages[0];
        }
      }
      
      // Check for profile image
      if (employee.profileImage) {
        return employee.profileImage;
      }
    }
    
    return null;
  };
  
  const getStatusClass = (record: AttendanceRecord): string => {
    if (record.type === 'sign-in') {
      return record.isLate 
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' 
        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    } else {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    }
  };

  // Get badge type based on attendance status
  const getStatusBadgeType = (record: AttendanceRecord): 'primary' | 'success' | 'warning' => {
    if (record.type === 'sign-in') {
      return record.isLate ? 'warning' : 'success';
    }
    return 'primary';
  };

  const getStatusText = (record: AttendanceRecord): string => {
    if (record.type === 'sign-in') {
      return record.isLate ? 'Late Arrival' : 'On Time';
    }
    return 'Sign Out';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading attendance records...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mr-2">
              Attendance Records
            </h2>
            {organizationName && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {organizationName}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              isLoading={refreshing}
              className="rounded-full p-1 ml-2"
              title="Refresh attendance records"
            >
              <RefreshCw size={16} />
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Input
              placeholder="Search employee or department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              className="w-full sm:w-64"
            />
            
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'sign-in' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('sign-in')}
              >
                Sign In
              </Button>
              <Button
                variant={filter === 'sign-out' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('sign-out')}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('employeeId')}>
                  <div className="flex items-center">
                    Employee
                    {sortField === 'employeeId' && (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('timestamp')}>
                  <div className="flex items-center">
                    Timestamp
                    {sortField === 'timestamp' && (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP Address
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {/* Improved image handling with better priority system */}
                          {(() => {
                            const imageUrl = getEmployeeImage(record);
                            
                            if (imageUrl) {
                              return (
                                <img 
                                  src={imageUrl}
                                  alt={getEmployeeName(record.employeeId, record.employeeName)}
                                  className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallbackDiv = e.currentTarget.parentElement?.querySelector('.fallback-initials');
                                    if (fallbackDiv) {
                                      fallbackDiv.classList.remove('hidden');
                                    }
                                  }}
                                />
                              );
                            }
                            return null;
                          })()}
                          
                          {/* Fallback initials if no image is available or loading fails */}
                          <div className={`h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium ${
                            getEmployeeImage(record) ? 'hidden' : ''
                          } fallback-initials`}>
                            {getEmployeeName(record.employeeId, record.employeeName)
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getEmployeeName(record.employeeId, record.employeeName)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getEmployeeDepartment(record.employeeId)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900 dark:text-white flex items-center">
                          <Clock size={14} className="mr-1" />
                          {formatTime(record.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(record.timestamp)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge
                        type={getStatusBadgeType(record)}
                        text={getStatusText(record)}
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {record.location ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <MapPin size={14} className="mr-1" />
                          <span className="truncate max-w-[120px]">
                            {typeof record.location === 'string' 
                              ? (() => {
                                  try {
                                    const loc = JSON.parse(record.location);
                                    return `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
                                  } catch (error) {
                                    console.error('Error parsing location:', error);
                                    return record.location; // If parsing fails, just display the string
                                  }
                                })()
                              : record.location.latitude && record.location.longitude
                                ? `${record.location.latitude.toFixed(4)}, ${record.location.longitude.toFixed(4)}`
                                : 'Invalid location'
                            }
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">No location</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {record.notes || '-'}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.ipAddress || 'Unknown'}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No attendance records found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;