import express, { Request, Response } from 'express';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { BoardState } from './BoardState';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Initial words defined only once, in the backend
const initialWords = [
  'love', 'dream', 'whisper', 'dance', 'moon', 'star',
  'gentle', 'wild', 'soul', 'heart', 'smile', 'laugh',
  'flutter', 'shine', 'glow', 'drift', 'float', 'sing',
  'the', 'and', 'in', 'of', 'with', 'through', 'beneath',
  'my', 'your', 'our', 'their', 'soft', 'bright', 'dark'
].map((text, id) => ({
  id,
  text,
  x: 20 + (id % 8) * 100,
  y: 20 + Math.floor(id / 8) * 40
}));

const boardState = new BoardState(initialWords);

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  // Log when the WebSocket server is created
  console.log('WebSocket server created on path: /ws');

  wss.on('connection', (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substring(7);
    console.log(`Client connected: ${clientId}`);

    boardState.addClient(clientId, ws);

    ws.on('message', (message: WebSocket.RawData) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message from client:', data);
        switch (data.type) {
          case 'moveWord':
            console.log('Moving word:', data.wordId, data.x, data.y);
            boardState.updateWordPosition(
              data.wordId,
              data.x,
              data.y,
              clientId
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
      console.log(`Client disconnected: ${clientId}`);
      boardState.removeClient(clientId);
    });
  });

  server.all('*', (req: Request, res: Response) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
