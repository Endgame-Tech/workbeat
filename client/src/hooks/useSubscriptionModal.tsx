import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SubscriptionPlan } from '../types/subscription.types';
import SubscriptionModal from '../components/subscription/SubscriptionModal';

interface SubscriptionModalContextType {
  showUpgradeModal: (options: {
    restrictedFeature?: string;
    requiredPlan?: SubscriptionPlan;
    featureName?: string;
  }) => void;
  hideModal: () => void;
  isModalOpen: boolean;
}

const SubscriptionModalContext = createContext<SubscriptionModalContextType | null>(null);

interface SubscriptionModalProviderProps {
  children: ReactNode;
}

export const SubscriptionModalProvider: React.FC<SubscriptionModalProviderProps> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<{
    restrictedFeature?: string;
    requiredPlan?: SubscriptionPlan;
    featureName?: string;
  }>({});

  const showUpgradeModal = (options: {
    restrictedFeature?: string;
    requiredPlan?: SubscriptionPlan;
    featureName?: string;
  }) => {
    setModalOptions(options);
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
    setModalOptions({});
  };

  return (
    <SubscriptionModalContext.Provider 
      value={{ 
        showUpgradeModal, 
        hideModal, 
        isModalOpen 
      }}
    >
      {children}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={hideModal}
        restrictedFeature={modalOptions.restrictedFeature}
        requiredPlan={modalOptions.requiredPlan}
        featureName={modalOptions.featureName}
      />
    </SubscriptionModalContext.Provider>
  );
};

export const useSubscriptionModal = (): SubscriptionModalContextType => {
  const context = useContext(SubscriptionModalContext);
  if (!context) {
    throw new Error('useSubscriptionModal must be used within SubscriptionModalProvider');
  }
  return context;
};

export default useSubscriptionModal;