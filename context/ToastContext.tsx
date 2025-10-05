import React, { createContext, useState, useCallback, useMemo } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  toast: ToastState | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  hideToast: () => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo(() => ({ toast, showToast, hideToast }), [toast, showToast, hideToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
