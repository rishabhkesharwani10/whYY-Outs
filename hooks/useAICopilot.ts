import { useContext } from 'react';
import { AICopilotContext } from '../context/AICopilotContext.tsx';

export const useAICopilot = () => {
  const context = useContext(AICopilotContext);
  if (context === undefined) {
    throw new Error('useAICopilot must be used within an AICopilotProvider');
  }
  return context;
};
