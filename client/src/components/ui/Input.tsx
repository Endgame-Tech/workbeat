import React, { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  const sizeStyles = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-13 px-5 text-base'
  };

  const variantStyles = {
    default: 'border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 focus:border-primary-500 focus:ring-primary-500/20',
    filled: 'border-0 bg-neutral-100 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-700 focus:ring-primary-500/20',
    outlined: 'border-2 border-neutral-300 dark:border-neutral-600 bg-transparent focus:border-primary-500 focus:ring-primary-500/20'
  };
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          className={`
            block w-full rounded-xl shadow-sm transition-all duration-200
            text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:disabled:bg-neutral-800
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
            {rightIcon}
          </div>
        )}
      </div>
      
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{helperText}</p>
      )}
      
      {error && (
        <p className="mt-1.5 text-sm text-danger-600 dark:text-danger-500">{error}</p>
      )}
    </div>
  );
};

export default Input;