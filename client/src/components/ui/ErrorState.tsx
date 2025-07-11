import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
  showRetry?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'There was an error loading this section. Please try again.',
  onRetry,
  className = '',
  showRetry = true
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 text-red-400">
        <AlertTriangle size={48} />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
        {description}
      </p>
      
      {showRetry && onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;