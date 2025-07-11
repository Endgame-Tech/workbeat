// ui/Table.tsx
import React from 'react';
import TruncatedText from './TruncatedText';

interface TableProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'striped' | 'bordered';
}

const Table: React.FC<TableProps> = ({ children, variant = 'default', className = '' }) => {
  const baseStyles = 'w-full border-collapse text-sm';
  
  const variantStyles = {
    default: '',
    striped: 'table-striped',
    bordered: 'border border-ui-borderLight dark:border-ui-border rounded-xl overflow-hidden'
  };
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;
  
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-ui-borderLight dark:border-ui-border">
      <table className={combinedClassName}>
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
    <thead className={`bg-ui-surfaceSecondary dark:bg-ui-surface/50 ${className}`}>
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
  variant?: 'default' | 'hover' | 'selected';
}

const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className = '',
  onClick,
  variant = 'default'
}) => {
  const baseStyles = 'border-b border-ui-borderLight dark:border-ui-border transition-colors duration-150';
  
  const variantStyles = {
    default: '',
    hover: 'hover:bg-ui-cardHover dark:hover:bg-ui-surface/50',
    selected: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
  };
  
  const interactiveStyles = onClick ? 'cursor-pointer hover:bg-ui-cardHover dark:hover:bg-ui-surface/50' : '';
  
  return (
    <tr 
      className={`${baseStyles} ${variantStyles[variant]} ${interactiveStyles} ${className}`}
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
      className={`px-6 py-4 font-semibold text-neutral-900 dark:text-white text-sm tracking-tight ${alignmentClasses[align]} ${className}`}
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
      className={`px-6 py-4 text-neutral-700 dark:text-neutral-300 text-sm ${alignmentClasses[align]} ${className}`}
      colSpan={colSpan}
    >
      {content}
    </td>
  );
};

interface TableFooterProps {
  children: React.ReactNode;
  className?: string;
}

const TableFooter: React.FC<TableFooterProps> = ({ children, className = '' }) => {
  return (
    <tfoot className={`bg-ui-surfaceSecondary dark:bg-ui-surface/50 ${className}`}>
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
      className={`px-6 py-4 font-semibold text-neutral-900 dark:text-white text-sm tracking-tight ${alignmentClasses[align]} ${sortable ? 'cursor-pointer select-none hover:bg-ui-cardHover dark:hover:bg-ui-surface/70 transition-colors duration-150' : ''} ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        {sortable && (
          <span className="ml-2 flex-shrink-0">
            {sorted === 'asc' && (
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
            {sorted === 'desc' && (
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {sorted === null && (
              <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className={`flex items-center justify-between px-6 py-4 border-t border-ui-borderLight dark:border-ui-border bg-ui-surfaceSecondary/50 dark:bg-ui-surface/30 ${className}`}>
      <button
        className="px-4 py-2 text-sm font-medium rounded-xl border border-ui-borderLight dark:border-ui-border bg-white dark:bg-ui-surface text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ui-cardHover dark:hover:bg-ui-surface/70 transition-colors duration-150"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      
      <div className="hidden sm:flex space-x-2">
        {getVisiblePages().map((page, index) => (
          page === '...' ? (
            <span 
              key={`ellipsis-${index}`} 
              className="px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400"
            >
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                page === currentPage
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-ui-surface text-neutral-700 dark:text-neutral-300 border border-ui-borderLight dark:border-ui-border hover:bg-ui-cardHover dark:hover:bg-ui-surface/70'
              }`}
              onClick={() => typeof page === 'number' && onPageChange(page)}
            >
              {page}
            </button>
          )
        ))}
      </div>
      
      <div className="sm:hidden">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <button
        className="px-4 py-2 text-sm font-medium rounded-xl border border-ui-borderLight dark:border-ui-border bg-white dark:bg-ui-surface text-neutral-700 dark:text-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ui-cardHover dark:hover:bg-ui-surface/70 transition-colors duration-150"
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