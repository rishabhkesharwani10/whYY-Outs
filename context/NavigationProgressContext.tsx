
import React, { createContext, useState, useCallback, useMemo, useContext, useRef } from 'react';

interface NavigationProgressContextType {
  progress: number;
  start: () => void;
  finish: () => void;
}

export const NavigationProgressContext = createContext<NavigationProgressContextType | undefined>(undefined);

export const NavigationProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
      }
  };

  const start = useCallback(() => {
    clearTimer();
    setProgress(10); // Start the bar visually
    // After a tiny delay, animate it to a near-complete state over a longer duration
    timerRef.current = setTimeout(() => setProgress(85), 100);
  }, []);

  const finish = useCallback(() => {
    clearTimer();
    setProgress(100); // Trigger the final animation to 100%
    // After it finishes, hide the bar
    timerRef.current = setTimeout(() => setProgress(0), 400); 
  }, []);

  const value = useMemo(() => ({
    progress,
    start,
    finish,
  }), [progress, start, finish]);

  return (
    <NavigationProgressContext.Provider value={value}>
      {children}
    </NavigationProgressContext.Provider>
  );
};

export const useNavigationProgress = () => {
  const context = useContext(NavigationProgressContext);
  if (context === undefined) {
    throw new Error('useNavigationProgress must be used within a NavigationProgressProvider');
  }
  return context;
};
