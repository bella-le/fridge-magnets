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
'\'s', '\'s', '\'s', '\'s', '\'s', '\'s', '\'s', '\'s', '&', ',', ',', ',', ',', ',', '?',
'?', '?', '?', '?', '!', '!', '!', '!', '!', ';', ';', ';', ';', ';', 'a', 'a', 'a', 'a', 'a', 'abg', 'above',
'above', 'above', 'afraid', 'alcohol', 'alien', 'all', 'always', 'amazing', 'amazing', 'am', 'am', 'an', 'an', 'an', 'and', 'and', 'at', 'at',
'ask', 'ass', 'awesome', 'awesome', 'because', 'belong', 'below', 'below', 'below', 'bitter', 'bitch', 'blobfish', 'bloom', 'blue', 'breeze',
'bird', 'but', 'but', 'by', 'by', 'bye', 'calm', 'cat', 'celebrate', 'chaos', 'child', 'children', 'cloud', 'club', 'cold', 'coffee', 'comet',
'cosmos', 'crazy', 'crazy', 'crescent', 'cry', 'curious', 'cute', 'damn', 'dinosaur', 'discover', 'disco', 'do', 'do', 'dream', 'dream', 'duck',
'dusk', 'dust', 'dumb', 'ed', 'ed', 'ed', 'ed', 'ed', 'ed', 'ed', 'ed', 'er', 'er', 'er', 'er', 'er', 'er',
'er', 'er', 'es', 'es', 'es', 'es', 'es', 'es', 'es', 'es', 'evening', 'excited', 'explore', 'farewell', 'father', 'fear', 'feel',
'feel', 'find', 'found', 'fish', 'fluffy', 'flower', 'forever', 'Freud', 'from', 'from', 'from', 'fuck', 'fuzzy', 'galaxy', 'ghost', 'giant', 'giraffe', 'go',
'go', 'god', 'goodbye', 'goose', 'grapefruit', 'green', 'happy', 'he', 'he', 'heaven', 'hell', 'herself', 'herself', 'himself', 'himself', 'hot', 'how', 'how',
'hello', 'hi', 'huge', 'huh', 'huh', 'hungry', 'i', 'i', 'idiot', 'if', 'if', 'in', 'in', 'in', 'ing', 'ing', 'ing',
'ing', 'ing', 'ing', 'ing', 'ing', 'is', 'is', 'it', 'it', 'its', 'its', 'jellyfish', 'juice', 'k', 'kazoo', 'ketchup', 'kitten', 'lasagna',
'lie', 'life', 'light', 'like', 'like', 'listen', 'listen', 'love', 'love', 'lovely', 'lovely', 'ly', 'ly', 'magic', 'me',
'me', 'meh', 'meh', 'midnight', 'moon', 'mother', 'morning', 'my', 'myself', 'myself', 'near', 'near', 'near', 'never', 'night', 'night',
'Nietzsche', 'now', 'ocean', 'Oedipus', 'oh', 'only', 'or', 'or', 'out', 'out', 'out', 'over', 'over', 'over',
'p', 'party', 'party', 'peace', 'people', 'pigeon', 'pink', 'platypus', 'poo', 'poop', 'psycho', 'purple', 'r', 'r', 'rave', 'rest', 'robot', 's', 's', 's', 's', 's', 's', 's',
's', 'sad', 'said', 'said', 'say', 'say', 'see', 'see', 'shadow', 'she', 'she', 'shiny', 'shit', 'shore', 'shut',
'sit', 'sky', 'sleepy', 'sloth', 'so', 'so', 'so', 'soft', 'sparkle', 'sparkly', 'spaghetti', 'star', 'starry', 'strong', 'stupid', 'sun',
'sweet', 't', 'tea', 'that', 'that', 'the', 'the', 'the', 'the', 'the', 'them', 'them', 'they', 'they', 'think', 'think', 'time',
'this', 'this', 'through', 'through', 'through', 'tiny', 'tired', 'to', 'to', 'to', 'today', 'together', 'tomorrow', 'twilight', 'under',
'under', 'under', 'universe', 'us', 'us', 'up', 'universe', 'was', 'was', 'wave', 'we', 'we', 'weird', 'weird', 'what', 'what', 'when', 'when',
'where', 'where', 'who', 'who', 'why', 'why', 'wild', 'wild', 'wind', 'with', 'with', 'with', 'within', 'within', 'within',
'wow', 'wow', 'y', 'y', 'yap', 'yak', 'ya', 'yay', 'yeah', 'yellow', 'yesterday', 'yo-yo', 'you', 'you', 'yourself', 'yourself', 'zucchini', 'bella', 'le'
].map((text, id) => ({
  id,
  text,
  x: 0,
  y: 0,
  onCanvas: false
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
          case 'addToCanvas':
            boardState.addWordToCanvas(
              data.wordId,
              data.x,
              data.y,
              clientId
            );
            break;
          case 'removeFromCanvas':
            boardState.removeFromCanvas(
              data.wordId,
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
