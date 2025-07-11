import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed relative overflow-hidden';
  
  const variantStyles = {
    // Using our CSS variables for primary and secondary colors
    primary: 'bg-ui-buttonPrimary hover:bg-ui-buttonPrimaryHover active:bg-ui-buttonPrimaryActive text-white shadow-md hover:shadow-lg focus-visible:ring-ui-focusRing border border-ui-buttonPrimary px-4 py-2 rounded-xl',
    secondary: 'bg-ui-buttonSecondary hover:bg-ui-buttonSecondaryHover text-white shadow-md hover:shadow-lg focus-visible:ring-ui-focusRing border border-ui-buttonSecondary px-4 py-2 rounded-xl',
    success: 'bg-success-600 hover:bg-success-700 active:bg-success-800 text-white shadow-md hover:shadow-lg focus-visible:ring-success-500 border border-success-600',
    warning: 'bg-warning-500 hover:bg-warning-600 active:bg-warning-700 text-white shadow-md hover:shadow-lg focus-visible:ring-warning-500 border border-warning-500',
    danger: 'bg-danger-600 hover:bg-danger-700 active:bg-danger-800 text-white shadow-md hover:shadow-lg focus-visible:ring-danger-500 border border-danger-600',
    ghost: 'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus-visible:ring-ui-focusRing',
    outline: 'bg-transparent hover:bg-ui-buttonPrimary hover:text-white text-ui-buttonPrimary border-2 border-ui-buttonPrimary focus-visible:ring-ui-focusRing px-4 py-2 rounded-xl',
    gradient: 'bg-gradient-primary text-white shadow-lg hover:shadow-xl focus-visible:ring-ui-focusRing border-0 hover:scale-[1.02] active:scale-[0.98]'
  };
  
  const sizeStyles = {
    xs: 'text-xs h-7 px-2.5 rounded-lg',
    sm: 'text-sm h-8 px-3 rounded-lg',
    md: 'text-sm h-10 px-4 rounded-xl',
    lg: 'text-base h-12 px-6 rounded-xl',
    xl: 'text-lg h-14 px-8 rounded-2xl',
    icon: 'h-10 w-10 p-2 rounded-xl'
  };
  
  const fullWidthStyle = fullWidth ? 'w-full' : '';
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidthStyle} ${className}`;

  return (
    <button 
      className={combinedClassName} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && (
        <span className="mr-2 flex-shrink-0">
          {leftIcon}
        </span>
      )}
      <span className={isLoading ? 'opacity-0' : ''}>{children}</span>
      {rightIcon && !isLoading && (
        <span className="ml-2 flex-shrink-0">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default Button;