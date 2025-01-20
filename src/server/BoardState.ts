import { WebSocket } from 'ws';

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface Client {
  id: string;
  ws: WebSocket;
}

export class BoardState {
  private words: Word[];
  private clients: Map<string, Client>;

  constructor(initialWords: Word[]) {
    this.words = initialWords;
    this.clients = new Map();
  }

  addClient(clientId: string, ws: WebSocket) {
    this.clients.set(clientId, { id: clientId, ws });
    this.broadcastClients();
    // Send initial state to new client
    this.sendToClient(clientId, {
      type: 'init',
      words: this.words,
      clients: Array.from(this.clients.keys())
    });
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId);
    this.broadcastClients();
  }

  updateWordPosition(wordId: number, x: number, y: number, clientId: string) {
    console.log('Updating word position:', { wordId, x, y, clientId });
    const word = this.words.find(w => w.id === wordId);
    if (word) {
      word.x = x;
      word.y = y;
      console.log('Word updated:', word);
      this.broadcast({
        type: 'wordMoved',
        wordId,
        x,
        y,
        movedBy: clientId
      });
    } else {
      console.log('Word not found:', wordId);
    }
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    console.log('Broadcasting message:', message);
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(messageStr);
          console.log('Sent to client:', client.id);
        } catch (error) {
          console.error('Error sending to client:', client.id, error);
        }
      } else {
        console.log('Client not ready:', client.id, 'state:', client.ws.readyState);
      }
    });
  }

  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcastClients() {
    this.broadcast({
      type: 'clients',
      clients: Array.from(this.clients.keys())
    });
  }
}
