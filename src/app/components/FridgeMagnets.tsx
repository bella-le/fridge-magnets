"use client";

import React, { useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Word, Client } from '../types';
import { Canvas } from './Canvas';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCursor } from '../hooks/useCursor';
import { useZoom } from '../hooks/useZoom';
import { usePanning } from '../hooks/usePanning';
import { useDrag } from '../hooks/useDrag';

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1200;
const WORD_PADDING = 20;

const FridgeMagnets = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const { scale, handleZoom, handlePinchZoom } = useZoom(1);
  const { position, isPanning, startPanning, updatePanPosition, stopPanning } = 
    usePanning(CANVAS_WIDTH, CANVAS_HEIGHT, scale);

  // Memoize WebSocket callbacks
  const handleInit = useCallback((words: Word[], clients: Client[]) => {
    setWords(words);
    setClients(clients);
  }, []);

  const handleWordMoved = useCallback((wordId: number, x: number, y: number) => {
    setWords(prevWords => 
      prevWords.map(word => 
        word.id === wordId 
          ? { ...word, x, y }
          : word
      )
    );
  }, []);

  const handleClientsUpdate = useCallback((clients: Client[]) => {
    setClients(clients);
  }, []);

  const handleCursorMoved = useCallback((clientId: string, x: number, y: number) => {
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === clientId
          ? { ...client, cursorX: x, cursorY: y }
          : client
      )
    );
  }, []);

  const { sendMessage, wsRef } = useWebSocket(
    handleInit,
    handleWordMoved,
    handleClientsUpdate,
    handleCursorMoved
  );

  // Memoize cursor callback
  const handleCursorUpdate = useCallback((x: number, y: number) => {
    sendMessage({ type: 'cursor', x, y });
  }, [sendMessage]);

  const { localCursor, updateCursorPosition, calculateRelativePosition } = useCursor(
    scale,
    position,
    boardRef,
    handleCursorUpdate
  );

  // Memoize drag callback
  const handleWordMove = useCallback((wordId: number, x: number, y: number) => {
    sendMessage({ type: 'moveWord', wordId, x, y });
  }, [sendMessage]);

  const { dragging, dragInfo, startDrag, updateDragPosition, stopDrag } = useDrag(
    scale,
    boardRef,
    position,
    handleWordMove,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    WORD_PADDING
  );

  useLayoutEffect(() => {
    const updateDeviceType = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, wordId?: number) => {
    if (wordId !== undefined) {
      const { x, y } = calculateRelativePosition(e.clientX, e.clientY);
      const word = words.find(w => w.id === wordId);
      if (word) {
        startDrag(e.clientX, e.clientY, wordId, word.x, word.y, false);
      }
    } else if (!dragging) {
      startPanning(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateCursorPosition(e.clientX, e.clientY);

    const { x, y } = calculateRelativePosition(e.clientX, e.clientY);
    if (dragging && !dragInfo.current.isTouchEvent) {
      updateDragPosition(x, y);
    } else if (isPanning) {
      updatePanPosition(e.clientX, e.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, wordId?: number) => {
    if (e.touches.length === 2) {
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
    const { x, y } = calculateRelativePosition(touch.clientX, touch.clientY);
    const word = words.find(w => w.id === wordId);
    if (word) {
      startDrag(touch.clientX, touch.clientY, wordId, word.x, word.y, true);
    }
  };

  const handleMouseUp = () => {
    stopDrag();
    stopPanning();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleZoom(e.deltaY);
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
      <Canvas
        words={words}
        clients={clients}
        scale={scale}
        position={position}
        isMobile={isMobile}
        localCursor={localCursor}
        wsRef={wsRef}
        dragInfo={dragInfo}
        canvasWidth={CANVAS_WIDTH}
        canvasHeight={CANVAS_HEIGHT}
        onWordMouseDown={handleMouseDown}
        onWordTouchStart={handleTouchStart}
      />
    </div>
  );
};

export default FridgeMagnets;
