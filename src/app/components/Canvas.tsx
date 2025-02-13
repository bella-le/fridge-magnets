import React from 'react';
import { Word as WordComponent } from './Word';
import { Cursor } from './Cursor';
import { Word, Client } from '../types';

interface CanvasProps {
  words: Word[];
  clients: Client[];
  scale: number;
  position: { x: number; y: number };
  isMobile: boolean;
  wsRef: React.RefObject<WebSocket>;
  dragInfo: React.MutableRefObject<{
    wordId: number | null;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    isTouchEvent: boolean;
  }>;
  canvasWidth: number;
  canvasHeight: number;
  localCursor: { x: number; y: number };
  onWordMouseDown: (e: React.MouseEvent, wordId: number) => void;
  onWordTouchStart: (e: React.TouchEvent, wordId: number) => void;
  onWordDelete: (wordId: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  words,
  clients,
  scale,
  position,
  isMobile,
  wsRef,
  dragInfo,
  canvasWidth,
  canvasHeight,
  onWordMouseDown,
  onWordTouchStart,
  onWordDelete,
}) => {
  return (
    <div style={{
      position: 'absolute',
      transform: `translate(${position.x * scale}px, ${position.y * scale}px) scale(${scale})`,
      transformOrigin: '0 0',
      width: `${canvasWidth}px`,
      height: `${canvasHeight}px`,
      background: `url('/fridge_texture.jpg') repeat`,
      boxShadow: '0 0 20px rgba(0,0,0,0.1)',
      borderRadius: '8px',
    }}>
      {/* Only show cursors for other clients */}
      {clients.map(client => {
        const isLocalClient = client.id === wsRef.current?.url;
        if (isLocalClient) return null;
        
        return (
          <Cursor
            key={client.id}
            x={client.cursorX}
            y={client.cursorY}
            color={client.color}
            isLocal={false}
          />
        );
      })}
      {words.map(word => (
        <WordComponent
          key={word.id}
          {...word}
          isMobile={isMobile}
          isDragging={dragInfo.current.wordId === word.id}
          onMouseDown={(e) => onWordMouseDown(e, word.id)}
          onTouchStart={(e) => onWordTouchStart(e, word.id)}
          onDeleteClick={onWordDelete}
        />
      ))}
    </div>
  );
};
