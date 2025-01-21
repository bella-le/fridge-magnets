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
  wordPadding: number
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
    clientX: number,
    clientY: number,
    wordId: number,
    wordX: number,
    wordY: number,
    isTouchEvent: boolean
  ) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (clientX - rect.left) / scale - position.x;
    const y = (clientY - rect.top) / scale - position.y;

    dragInfo.current = {
      wordId,
      startX: x,
      startY: y,
      offsetX: x - wordX,
      offsetY: y - wordY,
      isTouchEvent
    };
    setDragging(true);
  };

  const updateDragPosition = (x: number, y: number) => {
    if (!dragging || dragInfo.current.wordId === null) return;

    const newX = Math.max(wordPadding, 
      Math.min(canvasWidth - wordPadding, x - dragInfo.current.offsetX));
    const newY = Math.max(wordPadding, 
      Math.min(canvasHeight - wordPadding, y - dragInfo.current.offsetY));

    onWordMove(dragInfo.current.wordId, newX, newY);
  };

  const stopDrag = () => {
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
