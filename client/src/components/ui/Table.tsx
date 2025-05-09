// ui/Table.tsx
import React from 'react';
import TruncatedText from './TruncatedText';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full border-collapse text-sm ${className}`}>
        {children}
      </table>
    </div>
  );
};

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

const TableHead: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-800 ${className}`}>
      {children}
    </thead>
  );
};

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return <tbody className={className}>{children}</tbody>;
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className = '',
  onClick
}) => {
  return (
    <tr 
      className={`border-b border-gray-200 dark:border-gray-700 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

const TableHeader: React.FC<TableHeaderProps> = ({ 
  children, 
  className = '',
  align = 'left' 
}) => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <th 
      className={`px-4 py-3 font-medium text-gray-900 dark:text-white ${alignmentClasses[align]} ${className}`}
    >
      {children}
    </th>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  maxWidth?: string;
}

const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className = '',
  colSpan,
  align = 'left',
  truncate = false,
  maxWidth
}) => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };


    // If truncate is enabled and children is a string, wrap it in TruncatedText
  const content = truncate && typeof children === 'string' 
    ? <TruncatedText text={children} maxWidth={maxWidth} />
    : children;

  return (
    <td 
      className={`px-4 py-3 text-gray-700 dark:text-gray-300 ${alignmentClasses[align]} ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
};

interface TableFooterProps {
  children: React.ReactNode;
  className?: string;
}

const TableFooter: React.FC<TableFooterProps> = ({ children, className = '' }) => {
  return (
    <tfoot className={`bg-gray-50 dark:bg-gray-800 ${className}`}>
      {children}
    </tfoot>
  );
};

// Enhanced version with sorting capabilities
interface TableSortableHeaderProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

const TableSortableHeader: React.FC<TableSortableHeaderProps> = ({
  children,
  className = '',
  align = 'left',
  sortable = false,
  sorted = null,
  onSort
}) => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <th
      className={`px-4 py-3 font-medium text-gray-900 dark:text-white ${alignmentClasses[align]} ${sortable ? 'cursor-pointer select-none' : ''} ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        {sortable && (
          <span className="ml-1">
            {sorted === 'asc' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
            {sorted === 'desc' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {sorted === null && (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
};

// Pagination component for tables
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Show limited page numbers with ellipsis for large page counts
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return pages;
    }
    
    if (currentPage <= 3) {
      return [...pages.slice(0, 5), '...', totalPages];
    }
    
    if (currentPage >= totalPages - 2) {
      return [1, '...', ...pages.slice(totalPages - 5)];
    }
    
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    ];
  };
  
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${className}`}>
      <button
        className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      
      <div className="hidden sm:flex space-x-1">
        {getVisiblePages().map((page, index) => (
          page === '...' ? (
            <span 
              key={`ellipsis-${index}`} 
              className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              className={`px-3 py-1 text-sm rounded-md ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              }`}
              onClick={() => typeof page === 'number' && onPageChange(page)}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      <div className="sm:hidden">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <button
        className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

// Export all components
export {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableFooter,
  TableSortableHeader,
  TablePagination
};