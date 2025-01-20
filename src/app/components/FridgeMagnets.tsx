"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
}

const FridgeMagnets = () => {
  const CANVAS_WIDTH = 1600;
  const CANVAS_HEIGHT = 1000;

  const [words, setWords] = useState<Word[]>([]);
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(0);

  const boardRef = useRef(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dragInfo = useRef<{
    wordId: number | null;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  }>({
    wordId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });

  // WebSocket connection
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:3000/ws`;
    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      switch (data.type) {
        case 'init':
          console.log('Setting initial words:', data.words);
          setWords(data.words);
          break;
        case 'wordMoved':
          console.log('Updating word position:', data.wordId, data.x, data.y);
          setWords(prevWords => 
            prevWords.map(word => 
              word.id === data.wordId 
                ? { ...word, x: data.x, y: data.y }
                : word
            )
          );
          break;
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  useLayoutEffect(() => {
    const updateScale = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const scaleX = windowWidth / CANVAS_WIDTH;
      const scaleY = windowHeight / CANVAS_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
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
    
    let newX = (e.clientX - boardRect.left) / scale - dragInfo.current.offsetX;
    let newY = (e.clientY - boardRect.top) / scale - dragInfo.current.offsetY;
    
    newX = Math.max(0, Math.min(CANVAS_WIDTH - 100, newX));
    newY = Math.max(0, Math.min(CANVAS_HEIGHT - 40, newY));

    // Update local state immediately
    setWords(prevWords => 
      prevWords.map(word => 
        word.id === dragInfo.current.wordId 
          ? { ...word, x: newX, y: newY }
          : word
      )
    );

    // Send position update to server if connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'moveWord',
        wordId: dragInfo.current.wordId,
        x: newX,
        y: newY
      }));
    }
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
          visibility: scale === 0 ? 'hidden' : 'visible',
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