
import React from 'react';
import { useNavigationProgress } from '../context/NavigationProgressContext.tsx';

const TopProgressBar: React.FC = () => {
  const { progress } = useNavigationProgress();
  
  const isVisible = progress > 0;
  const isFinishing = progress === 100;
  
  // A long, slow transition for the loading phase, and a quick one for the finishing phase.
  const duration = isFinishing ? 0.3 : 10;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
        <div 
            style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #BFA181, #D7C0A5)',
                boxShadow: '0 0 10px #BFA181, 0 0 5px #BFA181',
                borderRadius: '0 2px 2px 0',
                transition: `width ${duration}s cubic-bezier(0.1, 0.9, 0.2, 1)`,
            }}
        />
    </div>
  );
};
export default TopProgressBar;
