import React from 'react';

interface MuteButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

export const MuteButton: React.FC<MuteButtonProps> = ({ isMuted, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      onTouchEnd={(e) => {
        e.preventDefault();
        onToggle();
      }}
      style={{
        position: 'fixed',
        bottom: 'max(20px, env(safe-area-inset-bottom))',
        right: 'max(110px, calc(env(safe-area-inset-right) + 90px))',
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        border: 'none',
        background: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        zIndex: 2000,
      }}
      title={isMuted ? "Unmute magnet sounds" : "Mute magnet sounds"}
    >
      {isMuted ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
};
