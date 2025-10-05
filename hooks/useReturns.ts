

import { useContext } from 'react';
import { ReturnContext } from '../context/ReturnContext.tsx';

export const useReturns = () => {
  const context = useContext(ReturnContext);
  if (context === undefined) {
    throw new Error('useReturns must be used within a ReturnProvider');
  }
  return context;
};