import { useState, useRef } from 'react';

interface DragInfo {
  wordId: number | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  isTouchEvent: boolean;
}

interface Position {
  x: number;
  y: number;
}

export const useDrag = (
  scale: number,
  boardRef: React.RefObject<HTMLDivElement>,
  position: Position,
  onWordMove: (wordId: number, x: number, y: number) => void,
  canvasWidth: number,
  canvasHeight: number,
  wordPadding: number,
  onRelease?: () => void
) => {
  const [dragging, setDragging] = useState(false);
  const dragInfo = useRef<DragInfo>({
    wordId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    isTouchEvent: false
  });

  const startDrag = (
    boardX: number,
    boardY: number,
    wordId: number,
    wordX: number,
    wordY: number,
    isTouchEvent: boolean
  ) => {
    // Calculate the position in canvas coordinates
    const canvasX = boardX / scale;
    const canvasY = boardY / scale;

    // Calculate the offset relative to the word position in canvas space
    const offsetX = canvasX - (wordX + position.x);
    const offsetY = canvasY - (wordY + position.y);

    dragInfo.current = {
      wordId,
      startX: canvasX,
      startY: canvasY,
      offsetX,
      offsetY,
      isTouchEvent
    };
    setDragging(true);
  };

  const updateDragPosition = (boardX: number, boardY: number) => {
    if (!dragging || dragInfo.current.wordId === null) return;

    // Convert board coordinates to canvas coordinates
    const canvasX = boardX / scale;
    const canvasY = boardY / scale;

    // Calculate new position with boundaries
    const newX = Math.max(wordPadding, 
      Math.min(canvasWidth - wordPadding, canvasX - dragInfo.current.offsetX - position.x));
    const newY = Math.max(wordPadding, 
      Math.min(canvasHeight - wordPadding, canvasY - dragInfo.current.offsetY - position.y));

    onWordMove(dragInfo.current.wordId, newX, newY);
  };

  const stopDrag = () => {
    if (dragging && dragInfo.current.wordId !== null) {
      onRelease?.();
    }
    setDragging(false);
    dragInfo.current.wordId = null;
  };

  return {
    dragging,
    dragInfo,
    startDrag,
    updateDragPosition,
    stopDrag,
  };
};
