import { useRef, useEffect } from 'react';
import { Word, Client } from '../types';

interface WebSocketMessage {
  type: string;
  words?: Word[];
  clients?: Client[];
  wordId?: number;
  x?: number;
  y?: number;
  clientId?: string;
  addedBy?: string;
  removedBy?: string;
}

export const useWebSocket = (
  onInit: (words: Word[], clients: Client[]) => void,
  onWordMoved: (wordId: number, x: number, y: number) => void,
  onClientsUpdate: (clients: Client[]) => void,
  onCursorMoved: (clientId: string, x: number, y: number) => void,
  onWordAddedToCanvas: (wordId: number, x: number, y: number) => void,
  onWordRemovedFromCanvas?: (wordId: number) => void
) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data);
      switch (data.type) {
        case 'init':
          if (data.words && data.clients) {
            onInit(
              data.words.map((word) => ({
                ...word,
                rotation: Math.random() * 15 - 7,
              })),
              data.clients
            );
          }
          break;
        case 'wordMoved':
          if (data.wordId !== undefined && data.x !== undefined && data.y !== undefined) {
            onWordMoved(data.wordId, data.x, data.y);
          }
          break;
        case 'clients':
          if (data.clients) {
            onClientsUpdate(data.clients);
          }
          break;
        case 'cursorMoved':
          if (data.clientId && data.x !== undefined && data.y !== undefined) {
            onCursorMoved(data.clientId, data.x, data.y);
          }
          break;
        case 'wordAddedToCanvas':
          if (data.wordId !== undefined && data.x !== undefined && data.y !== undefined) {
            onWordAddedToCanvas(data.wordId, data.x, data.y);
          }
          break;
        case 'wordRemovedFromCanvas':
          if (data.wordId !== undefined && onWordRemovedFromCanvas) {
            onWordRemovedFromCanvas(data.wordId);
          }
          break;
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [onInit, onWordMoved, onClientsUpdate, onCursorMoved, onWordAddedToCanvas, onWordRemovedFromCanvas]);

  const sendMessage = (message: any) => { // eslint-disable-line
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { sendMessage, wsRef };
};
