import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'glass' | 'elevated' | 'interactive';
  size?: 'sm' | 'md' | 'lg';
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  gradient?: boolean;
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
  justify?: 'start' | 'center' | 'end' | 'between';
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'overflow-hidden transition-all duration-200';
  
  const variantStyles = {
    default: 'bg-white dark:bg-neutral-800 shadow-soft border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl',
    outlined: 'border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-2xl',
    glass: 'glass rounded-2xl shadow-soft',
    elevated: 'bg-white dark:bg-neutral-800 shadow-medium hover:shadow-large rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50',
    interactive: 'card-interactive bg-white dark:bg-neutral-800 shadow-soft border border-neutral-200/50 dark:border-neutral-700/50 rounded-2xl hover:border-primary-200 dark:hover:border-primary-700'
  };

  const sizeStyles = {
    sm: 'rounded-xl',
    md: 'rounded-2xl', 
    lg: 'rounded-3xl'
  };
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  
  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

const CardTitle: React.FC<CardTitleProps> = ({
  children,
  level = 2,
  gradient = false,
  className = '',
  ...props
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const baseStyles = 'font-semibold tracking-tight';
  const gradientStyles = gradient ? 'text-gradient-primary' : 'text-neutral-900 dark:text-white';
  
  const sizeStyles = {
    1: 'text-3xl',
    2: 'text-xl',
    3: 'text-lg', 
    4: 'text-base',
    5: 'text-sm',
    6: 'text-xs'
  };
  
  const combinedClassName = `${baseStyles} ${gradientStyles} ${sizeStyles[level]} ${className}`;
  
  return (
    <Tag className={combinedClassName} {...props}>
      {children}
    </Tag>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  bordered = false,
  className = '',
  ...props
}) => {
  const borderStyle = bordered ? 'border-b border-neutral-200 dark:border-neutral-700' : '';
  const combinedClassName = `px-6 py-5 ${borderStyle} ${className}`;
  
  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

const CardContent: React.FC<CardContentProps> = ({
  children,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const combinedClassName = `${sizeStyles[size]} ${className}`;
  
  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({
  children,
  bordered = false,
  justify = 'end',
  className = '',
  ...props
}) => {
  const borderStyle = bordered ? 'border-t border-neutral-200 dark:border-neutral-700' : '';
  
  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center', 
    end: 'justify-end',
    between: 'justify-between'
  };
  
  const combinedClassName = `px-6 py-5 flex items-center gap-3 ${borderStyle} ${justifyStyles[justify]} ${className}`;
  
  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardContent, CardFooter, CardTitle };