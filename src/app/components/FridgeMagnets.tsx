"use client";

import React, { useState, useRef, useEffect } from 'react';

const FridgeMagnets = () => {
  // Base canvas size
  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 800;

  const initialWords = [
    'love', 'dream', 'whisper', 'dance', 'moon', 'star',
    'gentle', 'wild', 'soul', 'heart', 'smile', 'laugh',
    'flutter', 'shine', 'glow', 'drift', 'float', 'sing',
    'the', 'and', 'in', 'of', 'with', 'through', 'beneath',
    'my', 'your', 'our', 'their', 'soft', 'bright', 'dark'
  ].map((word, index) => ({
    id: index,
    text: word,
    x: 20 + (index % 8) * 100,
    y: 20 + Math.floor(index / 8) * 40
  }));

  const [words, setWords] = useState(initialWords);
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const boardRef = useRef(null);
  const dragInfo = useRef({
    wordId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });

  useEffect(() => {
    const updateScale = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculate scale based on both dimensions
      const scaleX = windowWidth / CANVAS_WIDTH;
      const scaleY = windowHeight / CANVAS_HEIGHT;
      const newScale = Math.min(scaleX, scaleY);
      
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleMouseDown = (e, word) => {
    const rect = e.target.getBoundingClientRect();
    dragInfo.current = {
      wordId: word.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: (e.clientX - rect.left) / scale,
      offsetY: (e.clientY - rect.top) / scale
    };
    setDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    
    const boardRect = boardRef.current.getBoundingClientRect();
    
    // Calculate new position relative to the board
    let newX = (e.clientX - boardRect.left) / scale - dragInfo.current.offsetX;
    let newY = (e.clientY - boardRect.top) / scale - dragInfo.current.offsetY;
    
    // Constrain to board boundaries
    newX = Math.max(0, Math.min(CANVAS_WIDTH - 100, newX));
    newY = Math.max(0, Math.min(CANVAS_HEIGHT - 40, newY));

    setWords(words.map(word => {
      if (word.id === dragInfo.current.wordId) {
        return { ...word, x: newX, y: newY };
      }
      return word;
    }));
  };

  const handleMouseUp = () => {
    setDragging(false);
    dragInfo.current.wordId = null;
  };

  return (
    <div className="fixed inset-0 bg-slate-100 overflow-hidden">
      <div 
        ref={boardRef}
        id="poetry-board"
        className="relative origin-top-left"
        style={{ 
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          transform: `scale(${scale})`,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {words.map(word => (
          <div
            key={word.id}
            onMouseDown={(e) => handleMouseDown(e, word)}
            className="absolute cursor-move select-none bg-white px-3 py-1 rounded shadow-md hover:shadow-lg transition-shadow"
            style={{
              left: `${word.x}px`,
              top: `${word.y}px`,
              fontFamily: 'serif',
              touchAction: 'none',
              userSelect: 'none'
            }}
          >
            {word.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FridgeMagnets;