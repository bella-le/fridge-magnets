"use client";

import React, { useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Word, Client } from '../types';
import { Canvas } from './Canvas';
import { WordBox } from './WordBox';
import { MuteButton } from './MuteButton';
import { useWebSocket } from '../hooks/useWebSocket';
import { useCursor } from '../hooks/useCursor';
import { useZoom } from '../hooks/useZoom';
import { usePanning } from '../hooks/usePanning';
import { useDrag } from '../hooks/useDrag';
import { useSound } from '../hooks/useSound';

const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1200;
const WORD_PADDING = 20;

const FridgeMagnets = () => {
  const [words, setWords] = useState<Word[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isWordBoxOpen, setIsWordBoxOpen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  const { scale, handleZoom } = useZoom(1);
  const { position, isPanning, startPanning, updatePanPosition, stopPanning } = 
    usePanning(CANVAS_WIDTH, CANVAS_HEIGHT, scale);

  const { playSound, isMuted, toggleMute } = useSound('/magnet-sound.mp3');

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

  const handleWordAddedToCanvas = useCallback((wordId: number, x: number, y: number) => {
    setWords(prevWords => 
      prevWords.map(word => 
        word.id === wordId 
          ? { ...word, x, y, onCanvas: true }
          : word
      )
    );
  }, []);

  const handleWordRemovedFromCanvas = useCallback((wordId: number) => {
    setWords(prevWords => 
      prevWords.map(word => 
        word.id === wordId 
          ? { ...word, onCanvas: false }
          : word
      )
    );
  }, []);

  const { sendMessage, wsRef } = useWebSocket(
    handleInit,
    handleWordMoved,
    handleClientsUpdate,
    handleCursorMoved,
    handleWordAddedToCanvas,
    handleWordRemovedFromCanvas
  );

  const handleWordDelete = useCallback((wordId: number) => {
    sendMessage({
      type: 'removeFromCanvas',
      wordId
    });
  }, [sendMessage]);

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
    WORD_PADDING,
    playSound
  );

  // Handle word selection from box
  const handleWordSelect = useCallback((word: Word) => {
    // Calculate the center of the viewport in screen coordinates
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const screenCenterX = viewportWidth / 2;
    const screenCenterY = viewportHeight / 2;

    // Convert screen coordinates to canvas coordinates
    const { x, y } = calculateRelativePosition(screenCenterX, screenCenterY);
    
    // Add a small random rotation for a natural look
    const rotation = Math.random() * 10 - 5; // Random rotation between -5 and 5 degrees
    
    sendMessage({
      type: 'addToCanvas',
      wordId: word.id,
      x,
      y,
      rotation
    });
  }, [sendMessage, calculateRelativePosition]);

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
      calculateRelativePosition(e.clientX, e.clientY);
      const word = words.find(w => w.id === wordId);
      if (word) {
        startDrag(e.clientX, e.clientY, wordId, word.x, word.y, false);
      }
    } else if (!dragging) {
      startPanning(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isWordBoxOpen) {
      updateCursorPosition(e.clientX, e.clientY);
    }

    const { x, y } = calculateRelativePosition(e.clientX, e.clientY);
    if (dragging && !dragInfo.current.isTouchEvent) {
      updateDragPosition(x, y);
    } else if (isPanning) {
      updatePanPosition(e.clientX, e.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, wordId?: number) => {
    e.preventDefault(); // Prevent default touch behavior
    e.stopPropagation();

    if (e.touches.length === 2) {
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

    if (wordId !== undefined) {
      const touch = e.touches[0];
      const word = words.find(w => w.id === wordId);
      if (word) {
        startDrag(touch.clientX, touch.clientY, wordId, word.x, word.y, true);
      }
    } else {
      const touch = e.touches[0];
      startPanning(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const delta = (dragInfo.current.startX - dist) * -1;
      handleZoom(delta);
      dragInfo.current.startX = dist;
      
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      updatePanPosition(midX, midY);
      return;
    }

    const touch = e.touches[0];
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Get the touch position relative to the board
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    if (dragging && dragInfo.current.isTouchEvent) {
      updateDragPosition(touchX, touchY);
    } else if (!dragging) {
      updatePanPosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragInfo.current.isTouchEvent) {
      stopDrag();
    }
    stopPanning();
    dragInfo.current.isTouchEvent = false;
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

  // Get words that are not on the canvas
  const availableWords = words.filter(word => !word.onCanvas);
  const canvasWords = words.filter(word => word.onCanvas);

  return (
    <div 
      ref={boardRef}
      className={isWordBoxOpen ? '' : 'fridge-board'}
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
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <Canvas
        words={canvasWords}
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
        onWordDelete={handleWordDelete}
      />
      <WordBox
        availableWords={availableWords}
        onWordSelect={handleWordSelect}
        onOpenChange={setIsWordBoxOpen}
      />
      <MuteButton isMuted={isMuted} onToggle={toggleMute} />
    </div>
  );
};

export default FridgeMagnets;
