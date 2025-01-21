import { useState } from 'react';

export const useZoom = (initialScale: number = 1) => {
  const [scale, setScale] = useState(initialScale);

  const handleZoom = (delta: number) => {
    setScale(s => Math.min(Math.max(0.5, s * (1 - delta * 0.001)), 3));
  };

  const handlePinchZoom = (startDist: number, currentDist: number, startScale: number) => {
    const newScale = Math.min(Math.max(0.5, startScale * (currentDist / startDist)), 3);
    setScale(newScale);
  };

  return {
    scale,
    handleZoom,
    handlePinchZoom,
  };
};
