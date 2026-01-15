import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Paywall } from '@/components/Paywall';

interface PaywallContextType {
  showPaywall: () => void;
  hidePaywall: () => void;
  isVisible: boolean;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const showPaywall = () => {
    setIsVisible(true);
  };

  const hidePaywall = () => {
    setIsVisible(false);
  };

  return (
    <PaywallContext.Provider value={{ showPaywall, hidePaywall, isVisible }}>
      {children}
      <Paywall visible={isVisible} onClose={hidePaywall} />
    </PaywallContext.Provider>
  );
}

export function usePaywall() {
  const context = useContext(PaywallContext);
  if (context === undefined) {
    throw new Error('usePaywall must be used within a PaywallProvider');
  }
  return context;
}
