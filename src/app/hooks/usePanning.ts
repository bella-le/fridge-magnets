import { useState, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

export const usePanning = (
  canvasWidth: number,
  canvasHeight: number,
  scale: number
) => {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPosition = useRef<Position>({ x: 0, y: 0 });

  const startPanning = (x: number, y: number) => {
    setIsPanning(true);
    lastPanPosition.current = { x, y };
  };

  const updatePanPosition = (clientX: number, clientY: number) => {
    if (!isPanning) return;

    const dx = clientX - lastPanPosition.current.x;
    const dy = clientY - lastPanPosition.current.y;
    
    setPosition(prev => {
      const newX = prev.x + dx / scale;
      const newY = prev.y + dy / scale;
      
      // Calculate visible canvas edges
      const viewportWidth = window.innerWidth / scale;
      const viewportHeight = window.innerHeight / scale;
      
      // Limit panning to keep canvas partially visible
      return {
        x: Math.max(-canvasWidth + viewportWidth * 0.2, 
           Math.min(canvasWidth - viewportWidth * 0.8, newX)),
        y: Math.max(-canvasHeight + viewportHeight * 0.2, 
           Math.min(canvasHeight - viewportHeight * 0.8, newY))
      };
    });
    
    lastPanPosition.current = { x: clientX, y: clientY };
  };

  const stopPanning = () => {
    setIsPanning(false);
  };

  return {
    position,
    isPanning,
    startPanning,
    updatePanPosition,
    stopPanning,
  };
};
