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
    default: 'bg-ui-cardBg shadow-soft border border-ui-cardBorder rounded-2xl',
    outlined: 'border-2 border-ui-cardBorder bg-ui-cardBg rounded-2xl',
    glass: 'glass rounded-2xl shadow-soft',
    elevated: 'bg-ui-cardBg shadow-medium hover:shadow-large rounded-2xl border border-ui-cardBorder',
    interactive: 'card-interactive bg-ui-cardBg shadow-soft border border-ui-cardBorder rounded-2xl hover:border-primary-200 dark:hover:border-primary-700'
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
  const baseStyles = 'font-semibold tracking-tight';
  const gradientStyles = gradient ? 'text-gradient-primary' : 'text-ui-cardText dark:text-white';
  
  const sizeStyles = {
    1: 'text-3xl',
    2: 'text-xl',
    3: 'text-lg', 
    4: 'text-base',
    5: 'text-sm',
    6: 'text-xs'
  };
  
  const combinedClassName = `${baseStyles} ${gradientStyles} ${sizeStyles[level]} ${className}`;
  
  return React.createElement(
    `h${level}` as keyof JSX.IntrinsicElements,
    { className: combinedClassName, ...props },
    children
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  bordered = false,
  className = '',
  ...props
}) => {
  const borderStyle = bordered ? 'border-b border-ui-cardBorder' : '';
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
  const borderStyle = bordered ? 'border-t border-ui-cardBorder' : '';
  
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