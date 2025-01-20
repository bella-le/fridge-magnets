import express, { Request, Response } from 'express';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { BoardState } from './BoardState';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

// Initial words defined only once, in the backend
const initialWords = [
'love', 'happy', 'sad', 'joy', 'smile', 'laugh', 'hope', 'dream', 'fear', 'wonder',
'jump', 'dance', 'eat', 'cook', 'sing', 'run', 'play', 'read', 'write', 'think',
'sun', 'moon', 'star', 'sky', 'ocean', 'flower', 'tree', 'river', 'snow', 'breeze',
'magic', 'sparkle', 'butterfly', 'wish', 'mystery', 'adventure', 'glitter', 'wander', 'galaxy',
'and', 'or', 'but', 'if', 'why', 'because', 'not', 'for', 'of', 'with', 'under', 'above', 'beside', 'below', 'on',
'why', 'how', 'when', 'where', 'who', 'the', 'the', 'a', 'a', 'an', 's', ',', ',',
'i', 'you', 'we', 'us', 'they', 'them', 'it', 'me', 'myself', 'yours', 'she', 'he', 's', '\'s', 'girl', 'boy'
].map((text, id) => ({
  id,
  text,
  x: 20 + (id % 12) * 100,
  y: 20 + Math.floor(id / 12) * 40
}));

const boardState = new BoardState(initialWords);

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  console.log('WebSocket server created on path: /ws');

  wss.on('connection', (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substring(7);
    console.log(`Client connected: ${clientId}`);

    boardState.addClient(clientId, ws);

    ws.on('message', (message: WebSocket.RawData) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'moveWord':
            boardState.updateWordPosition(
              data.wordId,
              data.x,
              data.y,
              clientId
            );
            break;
          case 'cursor':
            boardState.updateCursor(
              clientId,
              data.x,
              data.y
            );
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    });

    ws.on('close', () => {
      boardState.removeClient(clientId);
    });
  });

  server.all('*', (req: Request, res: Response) => {
    return handle(req, res);
  });

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
