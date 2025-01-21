"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  rotation?: number;
}

interface Client {
  id: string;
  color: string;
  cursorX: number;
  cursorY: number;
}

const FridgeMagnets = () => {
  // Define canvas boundaries
  const CANVAS_WIDTH = 2000;
  const CANVAS_HEIGHT = 1200;
  const WORD_PADDING = 20; // Buffer space from edges
  const MOBILE_SCALE_FACTOR = 0.8;

  const [words, setWords] = useState<Word[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [localCursor, setLocalCursor] = useState({ x: 0, y: 0 });
  const lastPanPosition = useRef({ x: 0, y: 0 });

  const boardRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dragInfo = useRef({
    wordId: null as number | null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    isTouchEvent: false
  });

  // Cursor update throttling
  const lastCursorUpdate = useRef<number>(0);
  const CURSOR_UPDATE_INTERVAL = 50; // Back to 50ms for server updates

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'init':
          setWords(data.words.map((word: Word) => ({
            ...word,
            rotation: Math.random() * 15 - 7
          })));
          setClients(data.clients);
          break;
        case 'wordMoved':
          setWords(prevWords => 
            prevWords.map(word => 
              word.id === data.wordId 
                ? { ...word, x: data.x, y: data.y }
                : word
            )
          );
          break;
        case 'clients':
          setClients(data.clients);
          break;
        case 'cursorMoved':
          setClients(prevClients => 
            prevClients.map(client => 
              client.id === data.clientId
                ? { ...client, cursorX: data.x, cursorY: data.y }
                : client
            )
          );
          break;
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  useLayoutEffect(() => {
    const updateDeviceType = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  const handleTouchStart = (e: React.TouchEvent, wordId?: number) => {
    if (e.touches.length === 2) {
      // Pinch-zoom start
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      dragInfo.current = {
        ...dragInfo.current,
        startX: dist,
        startY: scale,
        isTouchEvent: true
      };
      return;
    }

    if (wordId === undefined) return;

    e.preventDefault();
    const touch = e.touches[0];
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (touch.clientX - rect.left) / scale - position.x;
    const y = (touch.clientY - rect.top) / scale - position.y;

    dragInfo.current = {
      wordId,
      startX: x,
      startY: y,
      offsetX: x - words.find(w => w.id === wordId)!.x,
      offsetY: y - words.find(w => w.id === wordId)!.y,
      isTouchEvent: true
    };
    setDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch-zoom
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      const startDist = dragInfo.current.startX;
      const startScale = dragInfo.current.startY;
      const newScale = Math.min(Math.max(0.5, startScale * (dist / startDist)), 3);
      setScale(newScale);
      return;
    }

    if (!dragging || !dragInfo.current.isTouchEvent || !dragInfo.current.wordId) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (touch.clientX - rect.left) / scale - position.x;
    const y = (touch.clientY - rect.top) / scale - position.y;

    const newX = Math.max(WORD_PADDING, Math.min(CANVAS_WIDTH - WORD_PADDING, x - dragInfo.current.offsetX));
    const newY = Math.max(WORD_PADDING, Math.min(CANVAS_HEIGHT - WORD_PADDING, y - dragInfo.current.offsetY));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'moveWord',
        wordId: dragInfo.current.wordId,
        x: newX,
        y: newY
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent, wordId?: number) => {
    if (wordId !== undefined) {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left) / scale - position.x;
      const y = (e.clientY - rect.top) / scale - position.y;

      dragInfo.current = {
        wordId,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: x - words.find(w => w.id === wordId)!.x,
        offsetY: y - words.find(w => w.id === wordId)!.y,
        isTouchEvent: false
      };
      setDragging(true);
    } else if (!dragging) {
      // Start panning
      setIsPanning(true);
      lastPanPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const calculateRelativePosition = (clientX: number, clientY: number) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    return {
      x: (clientX - rect.left) / scale - position.x,
      y: (clientY - rect.top) / scale - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = calculateRelativePosition(e.clientX, e.clientY);
    
    // Update local cursor position immediately
    setLocalCursor({ x, y });

    // Send to server with throttling
    const now = Date.now();
    if (now - lastCursorUpdate.current > CURSOR_UPDATE_INTERVAL) {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'cursor',
          x,
          y
        }));
      }
      lastCursorUpdate.current = now;
    }

    // Handle dragging
    if (dragging && dragInfo.current.wordId !== null && !dragInfo.current.isTouchEvent) {
      const newX = Math.max(WORD_PADDING, Math.min(CANVAS_WIDTH - WORD_PADDING, x - dragInfo.current.offsetX));
      const newY = Math.max(WORD_PADDING, Math.min(CANVAS_HEIGHT - WORD_PADDING, y - dragInfo.current.offsetY));

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'moveWord',
          wordId: dragInfo.current.wordId,
          x: newX,
          y: newY
        }));
      }
    } else if (isPanning) {
      // Handle panning with boundaries
      const dx = e.clientX - lastPanPosition.current.x;
      const dy = e.clientY - lastPanPosition.current.y;
      
      setPosition(prev => {
        const newX = prev.x + dx / scale;
        const newY = prev.y + dy / scale;
        
        // Calculate visible canvas edges
        const viewportWidth = window.innerWidth / scale;
        const viewportHeight = window.innerHeight / scale;
        
        // Limit panning to keep canvas partially visible
        return {
          x: Math.max(-CANVAS_WIDTH + viewportWidth * 0.2, Math.min(CANVAS_WIDTH - viewportWidth * 0.8, newX)),
          y: Math.max(-CANVAS_HEIGHT + viewportHeight * 0.2, Math.min(CANVAS_HEIGHT - viewportHeight * 0.8, newY))
        };
      });
      
      lastPanPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setIsPanning(false);
    dragInfo.current.wordId = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom with ctrl/cmd + wheel
      e.preventDefault();
      const delta = e.deltaY;
      setScale(s => Math.min(Math.max(0.5, s * (1 - delta * 0.001)), 3));
    }
  };

  return (
    <div 
      ref={boardRef}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%)`,
        width: '100vw',
        height: '100vh',
        background: '#f0f0f0',
        overflow: 'hidden',
        touchAction: 'none'
      }}
      onMouseDown={(e) => handleMouseDown(e)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={(e) => handleTouchStart(e)}
      onWheel={handleWheel}
    >
      <div style={{
        position: 'absolute',
        transform: `translate(${position.x * scale}px, ${position.y * scale}px) scale(${scale})`,
        transformOrigin: '0 0',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        background: `url('/fridge_texture.jpg') repeat`,
        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        borderRadius: '8px'
      }}>
        {/* Cursors */}
        {clients.map(client => {
          const isLocalClient = client.id === wsRef.current?.url;
          const cursorX = isLocalClient ? localCursor.x : client.cursorX;
          const cursorY = isLocalClient ? localCursor.y : client.cursorY;
          
          return (
            <div
              key={client.id}
              className="absolute pointer-events-none"
              style={{
                position: 'absolute',
                left: `${cursorX}px`,
                top: `${cursorY}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 2000,
                transition: isLocalClient 
                  ? 'none'  // No transition for local cursor
                  : 'left 50ms ease-out, top 50ms ease-out', // Shorter, snappier transition for other cursors
                willChange: 'left, top'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path
                  d="M0 0L16 6L6 16L0 0Z"
                  fill={client.color}
                />
              </svg>
            </div>
          );
        })}
        {/* Words */}
        {words.map((word) => (
          <div
            key={word.id}
            style={{
              position: 'absolute',
              left: `${word.x}px`,
              top: `${word.y}px`,
              fontFamily: 'serif',
              transform: `rotate(${word.rotation}deg)`,
              padding: '8px 12px',
              background: 'white',
              boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
              borderRadius: '4px',
              userSelect: 'none',
              fontSize: isMobile ? '18px' : '16px',
              zIndex: dragging && dragInfo.current.wordId === word.id ? 1000 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, word.id)}
            onTouchStart={(e) => handleTouchStart(e, word.id)}
          >
            {word.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FridgeMagnets;
