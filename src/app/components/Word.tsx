import React, { useState, useRef } from 'react';
import { Word as WordType } from '../types';

interface WordProps extends WordType {
  isMobile: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onDeleteClick?: (wordId: number) => void;
}

export const Word: React.FC<WordProps> = ({
  id,
  text,
  x,
  y,
  rotation,
  isMobile,
  isDragging,
  onMouseDown,
  onTouchStart,
  onDeleteClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const lastClickTime = useRef<number>(0);
  const lastTouchTime = useRef<number>(0);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick?.(id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      // Double click detected
      handleDoubleClick(e);
    } else {
      // Single click - handle normal drag
      onMouseDown(e);
    }
    lastClickTime.current = now;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    if (now - lastTouchTime.current < 300) {
      // Double tap detected
      onDeleteClick?.(id);
    } else {
      // Single tap - handle normal touch
      onTouchStart(e);
    }
    lastTouchTime.current = now;
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: `rotate(${rotation}deg)`,
        padding: '12px', // Invisible padding around the word
        userSelect: 'none',
        touchAction: 'none', // Prevent browser touch actions
        WebkitTouchCallout: 'none', // Prevent iOS callout
        WebkitUserSelect: 'none', // Prevent text selection
        zIndex: isDragging ? 1000 : 1,
        cursor: 'grab'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Inner content container */}
      <div style={{
        fontFamily: 'serif',
        padding: '2px 4px',
        background: 'white',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
        fontSize: isMobile ? '18px' : '16px',
        position: 'relative', // For proper stacking context
      }}>
        {text}
      </div>
      {isHovered && onDeleteClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick(id);
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking delete
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '24px',
            height: '24px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            fontSize: '16px',
            lineHeight: '1',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(-${rotation}deg)`, // Counter-rotate to keep X upright
            zIndex: 1001,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)' // Add subtle shadow for better visibility
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
