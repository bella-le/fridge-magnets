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
  const CANVAS_WIDTH = 1600;
  const CANVAS_HEIGHT = 1000;

  const [words, setWords] = useState<Word[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dragging, setDragging] = useState(false);
  const [scale, setScale] = useState(0);

  const boardRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dragInfo = useRef({
    wordId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  });

  // Cursor update throttling
  const lastCursorUpdate = useRef<number>(0);
  const CURSOR_UPDATE_INTERVAL = 50; // ms

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

  const sendCursorPosition = (e: React.MouseEvent) => {
    if (!wsRef.current || !boardRef.current) return;
    
    const now = Date.now();
    if (now - lastCursorUpdate.current < CURSOR_UPDATE_INTERVAL) return;
    lastCursorUpdate.current = now;

    const boardRect = boardRef.current.getBoundingClientRect();
    const x = (e.clientX - boardRect.left) / scale;
    const y = (e.clientY - boardRect.top) / scale;

    wsRef.current.send(JSON.stringify({
      type: 'cursor',
      x,
      y
    }));
  };

  const handleMouseDown = (e: React.MouseEvent, word: Word) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dragInfo.current = {
      wordId: word.id,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: (e.clientX - rect.left) / scale,
      offsetY: (e.clientY - rect.top) / scale
    };
    setDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    sendCursorPosition(e);
    
    if (!dragging) return;
    
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;
    
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
        {/* Cursors */}
        {clients.map(client => (
          <div
            key={client.id}
            className="absolute pointer-events-none"
            style={{
              left: `${client.cursorX}px`,
              top: `${client.cursorY}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path
                d="M0 0L16 6L6 16L0 0Z"
                fill={client.color}
              />
            </svg>
          </div>
        ))}

        {/* Words */}
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
              userSelect: 'none',
              transform: `rotate(${word.rotation || 0}deg)`,
              transformOrigin: 'center center'
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
