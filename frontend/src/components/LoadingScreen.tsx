import React from 'react';

interface LoadingScreenProps {
  statusText: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ statusText }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner-ring"></div>
      <p className="loading-text">{statusText}</p>
      <span style={{
        marginTop: '0.5rem',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}>
        Please wait a moment
      </span>
    </div>
  );
};
