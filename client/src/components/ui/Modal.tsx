// ui/Modal.tsx
import React, { useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  maxHeight?: string;
  preventScroll?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  maxHeight = '90vh',
  preventScroll = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Map maxWidth to actual width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };
  
  if (!isOpen) return null;

  // Prevent body scrolling when modal is open
  if (isOpen && preventScroll) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity overflow-auto"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full ${maxWidthClasses[maxWidth]} transform transition-all`}
        style={{ maxHeight }}
      >
        {title && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-4">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className={`${title ? '' : 'pt-4'} overflow-auto`} style={{ maxHeight: title ? 'calc(90vh - 57px)' : '90vh' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;