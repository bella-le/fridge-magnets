import { useState, useRef } from 'react';

interface CursorPosition {
  x: number;
  y: number;
}

export const useCursor = (
  scale: number,
  position: CursorPosition,
  boardRef: React.RefObject<HTMLDivElement>,
  onCursorUpdate: (x: number, y: number) => void
) => {
  const [localCursor, setLocalCursor] = useState<CursorPosition>({ x: 0, y: 0 });
  const lastCursorUpdate = useRef<number>(0);
  const CURSOR_UPDATE_INTERVAL = 50;

  const calculateRelativePosition = (clientX: number, clientY: number): CursorPosition => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (clientX - rect.left) / scale - position.x,
      y: (clientY - rect.top) / scale - position.y
    };
  };

  const updateCursorPosition = (clientX: number, clientY: number) => {
    const { x, y } = calculateRelativePosition(clientX, clientY);
    
    // Update local cursor position immediately
    setLocalCursor({ x, y });

    // Send to server with throttling
    const now = Date.now();
    if (now - lastCursorUpdate.current > CURSOR_UPDATE_INTERVAL) {
      onCursorUpdate(x, y);
      lastCursorUpdate.current = now;
    }
  };

  return {
    localCursor,
    updateCursorPosition,
    calculateRelativePosition,
  };
};
