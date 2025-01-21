import React from 'react';

interface CursorProps {
  x: number;
  y: number;
  color: string;
  isLocal: boolean;
}

export const Cursor: React.FC<CursorProps> = ({ x, y, color, isLocal }) => {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 2000,
        transition: isLocal 
          ? 'none'  // No transition for local cursor
          : 'left 50ms ease-out, top 50ms ease-out', // Shorter, snappier transition for other cursors
        willChange: 'left, top'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path
          d="M0 0L16 6L6 16L0 0Z"
          fill={color}
        />
      </svg>
    </div>
  );
};
