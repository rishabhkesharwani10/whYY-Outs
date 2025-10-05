import React from 'react';
import Icon from './Icon.tsx';
import { useAICopilot } from '../hooks/useAICopilot.ts';

const AIPilotFAB: React.FC = () => {
  const { toggleCopilot, isAvailable } = useAICopilot();

  if (!isAvailable) {
    return null;
  }

  return (
    <button
      onClick={toggleCopilot}
      className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-16 h-16 bg-gradient-to-br from-brand-gold to-brand-gold-dark rounded-full shadow-2xl shadow-brand-gold/40 flex items-center justify-center text-brand-dark z-40 hover:scale-110 transition-transform"
      aria-label="Open whYYOuts AI"
    >
      <Icon name="sparkles" className="w-8 h-8"/>
    </button>
  );
};

export default AIPilotFAB;