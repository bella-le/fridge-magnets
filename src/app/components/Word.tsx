import React from 'react';
import { Word as WordType } from '../types';

interface WordProps extends WordType {
  isMobile: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
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
  onTouchStart
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        fontFamily: 'serif',
        transform: `rotate(${rotation}deg)`,
        padding: '2px 4px',
        background: 'white',
        boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
        userSelect: 'none',
        fontSize: isMobile ? '18px' : '16px',
        zIndex: isDragging ? 1000 : 1
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {text}
    </div>
  );
};
