// ui/TruncatedText.tsx
import React, { useState, useRef, useEffect } from 'react';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  maxWidth?: string;
  className?: string;
  tooltip?: boolean;
}

const TruncatedText: React.FC<TruncatedTextProps> = ({ 
  text, 
  maxLength = 30, 
  maxWidth,
  className = '',
  tooltip = true
}) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // Check if text needs truncation
  useEffect(() => {
    const checkTruncation = () => {
      if (elementRef.current) {
        if (text.length > maxLength) {
          setIsTruncated(true);
        } else if (elementRef.current.scrollWidth > elementRef.current.clientWidth) {
          setIsTruncated(true);
        } else {
          setIsTruncated(false);
        }
      }
    };
    
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    
    return () => {
      window.removeEventListener('resize', checkTruncation);
    };
  }, [text, maxLength]);
  
  // Position tooltip
  useEffect(() => {
    const positionTooltip = () => {
      if (isTooltipVisible && elementRef.current && tooltipRef.current) {
        const rect = elementRef.current.getBoundingClientRect();
        tooltipRef.current.style.left = `${rect.left}px`;
        tooltipRef.current.style.top = `${rect.top - 35}px`;
      }
    };
    
    positionTooltip();
    window.addEventListener('scroll', positionTooltip);
    window.addEventListener('resize', positionTooltip);
    
    return () => {
      window.removeEventListener('scroll', positionTooltip);
      window.removeEventListener('resize', positionTooltip);
    };
  }, [isTooltipVisible]);

  // Display either truncated text or full text
  const displayText = isTruncated 
    ? text.length > maxLength 
      ? `${text.substring(0, maxLength)}...` 
      : text
    : text;
  
  return (
    <div className="relative">
      <div
        ref={elementRef}
        className={`truncate ${className}`}
        style={{ maxWidth: maxWidth || 'inherit' }}
        onMouseEnter={() => isTruncated && tooltip && setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      >
        {displayText}
      </div>
      
      {isTruncated && tooltip && isTooltipVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-md whitespace-normal max-w-xs"
        >
          {text}
        </div>
      )}
    </div>
  );
};

export default TruncatedText;