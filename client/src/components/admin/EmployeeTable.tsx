// Enhanced EmployeeTable.tsx with filtering, deactivation, and modal details
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  TableHead, 
  TableRow, 
  TableHeader, 
  TableBody, 
  TableCell 
} from '../ui/Table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { 
  UserX, 
  UserCheck, 
  Search, 
  Filter, 
  ChevronDown, 
  Edit, 
  Trash2,
  UserPlus,
  X,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Employee } from '../../types';
import { employeeService } from '../../services/employeeService';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatters';

interface EmployeeTableProps {
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
  onAddNew?: () => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({
  onEdit,
  onDelete,
  onAddNew
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Apply filters when search or active filter changes
  const applyFilters = useCallback((
    allEmployees: Employee[], 
    query: string, 
    activeOnly: boolean,
    department: string
  ) => {
    let filtered = [...allEmployees];
    
    // Filter by active status
    if (activeOnly) {
      filtered = filtered.filter(emp => emp.isActive);
    }
    
    // Filter by department if selected
    if (department) {
      filtered = filtered.filter(emp => emp.department === department);
    }
    
    // Filter by search query
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      filtered = filtered.filter(
        emp => 
          emp.name.toLowerCase().includes(lowerCaseQuery) ||
          emp.email.toLowerCase().includes(lowerCaseQuery) ||
          (emp.position?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
          (emp.employeeId?.toLowerCase().includes(lowerCaseQuery) ?? false)
      );
    }
    
    setFilteredEmployees(filtered);
  }, []);

  // Fetch employees with useCallback
  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const allEmployees = await employeeService.getAllEmployees();
      setEmployees(allEmployees);
      
      // Extract unique departments for filtering with proper type checking
      const uniqueDepartments = [...new Set(allEmployees
        .map((emp: Employee) => emp.department)
        .filter((dept: string | undefined): dept is string => typeof dept === 'string' && dept.trim() !== '')
      )] as string[];
      setDepartments(uniqueDepartments);
      
      // Apply initial filters
      applyFilters(allEmployees, searchQuery, showActiveOnly, selectedDepartment);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, showActiveOnly, selectedDepartment, applyFilters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    applyFilters(employees, searchQuery, showActiveOnly, selectedDepartment);
  }, [employees, searchQuery, showActiveOnly, selectedDepartment, applyFilters]);

  // Toggle employee active status
  const toggleEmployeeStatus = async (employee: Employee, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the modal when clicking this button
    
    try {
      const newStatus = !employee.isActive;
      await employeeService.toggleEmployeeStatus(employee._id, newStatus);
      
      // Update local state
      const updatedEmployees = employees.map(emp => 
        emp._id === employee._id ? { ...emp, isActive: newStatus } : emp
      );
      
      setEmployees(updatedEmployees);
      applyFilters(updatedEmployees, searchQuery, showActiveOnly, selectedDepartment);
      
      toast.success(`Employee ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling employee status:', error);
      toast.error('Failed to update employee status');
    }
  };
  
  // Handle row click to show details
  const handleRowClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setShowActiveOnly(true);
    setSelectedDepartment('');
    setIsFilterOpen(false);
  };
  
  return (
    <>
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Employees</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                leftIcon={<Filter size={16} />}
                rightIcon={<ChevronDown size={16} />}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                Filters
              </Button>
              {onAddNew && (
                <Button
                  variant="primary"
                  leftIcon={<UserPlus size={16} />}
                  onClick={onAddNew}
                >
                  Add Employee
                </Button>
              )}
            </div>
          </div>
          
          {/* Search and filter options */}
          <div className="pt-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-grow">
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search size={18} />}
                  rightIcon={
                    searchQuery ? (
                      <X
                        size={18}
                        className="cursor-pointer"
                        onClick={() => setSearchQuery('')}
                      />
                    ) : undefined
                  }
                />
              </div>
              <Button
                variant={showActiveOnly ? "primary" : "outline"}
                onClick={() => setShowActiveOnly(true)}
                leftIcon={<UserCheck size={16} />}
              >
                Active
              </Button>
              <Button
                variant={!showActiveOnly ? "primary" : "outline"}
                onClick={() => setShowActiveOnly(false)}
                leftIcon={<UserX size={16} />}
              >
                All
              </Button>
            </div>
            
            {/* Additional filters (shown/hidden) */}
            {isFilterOpen && (
              <div className="pt-2 pb-1 border-t border-gray-200 dark:border-gray-800">
                <div className="grid md:grid-cols-3 gap-3 mt-2">
                  <div>
                    <p className="text-sm font-medium mb-1">Department</p>
                    <select
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm bg-white dark:bg-gray-800"
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2 flex items-end justify-end">
                    <Button
                      variant="ghost"
                      onClick={resetFilters}
                      leftIcon={<X size={16} />}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Employee</TableHeader>
                    <TableHeader>Department</TableHeader>
                    <TableHeader>Position</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader className="text-right">Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No employees found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow 
                        key={employee._id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => handleRowClick(employee)}
                      >
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-300 font-semibold">
                                {employee.name?.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {employee.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.department || '-'}</TableCell>
                        <TableCell>{employee.position || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            type={employee.isActive ? 'success' : 'gray'}
                            text={employee.isActive ? 'Active' : 'Inactive'}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit && onEdit(employee);
                              }}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant={employee.isActive ? "danger" : "success"}
                              size="icon"
                              onClick={(e) => toggleEmployeeStatus(employee, e)}
                              title={employee.isActive ? "Deactivate" : "Activate"}
                            >
                              {employee.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                            </Button>
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(employee);
                                }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </CardFooter>
      </Card>
      
      {/* Employee Detail Modal */}
      {selectedEmployee && (
         <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Employee Details"
          maxWidth="md"
          preventScroll
        >
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-300 text-2xl font-semibold">
                  {selectedEmployee.name?.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold truncate">{selectedEmployee.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 truncate">
                  {selectedEmployee.position} - {selectedEmployee.department}
                </p>
              </div>
              <div className="ml-auto flex-shrink-0">
                <Badge
                  type={selectedEmployee.isActive ? 'success' : 'gray'}
                  text={selectedEmployee.isActive ? 'Active' : 'Inactive'}
                  size="lg"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p>{selectedEmployee.email || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                    <p>{selectedEmployee.phone || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                    <p>{selectedEmployee.address || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Briefcase className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee ID</p>
                    <p>{selectedEmployee.employeeId || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hire Date</p>
                    <p>{selectedEmployee.hireDate ? formatDate(selectedEmployee.hireDate.toString()) : '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <UserCheck className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <p>{selectedEmployee.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Information */}
            {selectedEmployee.notes && (
              <div className="mt-6">
                <h4 className="text-md font-medium mb-2">Notes</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm">
                  {selectedEmployee.notes}
                </div>
              </div>
            )}
            
            {/* Working Hours */}
            {selectedEmployee.workingHours && (
              <div className="mt-6">
                <h4 className="text-md font-medium mb-2">Working Hours</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</p>
                      <p>{selectedEmployee.workingHours.start || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">End Time</p>
                      <p>{selectedEmployee.workingHours.end || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-end space-x-3">
              {onEdit && (
                <Button
                  variant="outline"
                  leftIcon={<Edit size={16} />}
                  onClick={() => {
                    setIsModalOpen(false);
                    onEdit(selectedEmployee);
                  }}
                >
                  Edit
                </Button>
              )}
              <Button
                variant={selectedEmployee.isActive ? "danger" : "success"}
                leftIcon={selectedEmployee.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                onClick={(e) => {
                  toggleEmployeeStatus(selectedEmployee, e as React.MouseEvent);
                  setIsModalOpen(false);
                }}
              >
                {selectedEmployee.isActive ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default EmployeeTable;