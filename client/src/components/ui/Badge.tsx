// ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  text: string;
  size?: 'sm' | 'md' | 'lg';
}

const Badge: React.FC<BadgeProps> = ({ type, text, size = 'md' }) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  };
  
  // Type classes
  const typeClasses = {
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    info: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${typeClasses[type]}`;
  
  return (
    <span className={classes}>
      {text}
    </span>
  );
};

export default Badge;