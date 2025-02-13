import { WebSocket } from 'ws';

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  onCanvas: boolean;
}

interface Client {
  id: string;
  ws: WebSocket;
  color: string;
  cursorX: number;
  cursorY: number;
}

export class BoardState {
  private words: Word[];
  private clients: Map<string, Client>;

  constructor(initialWords: Word[]) {
    this.words = initialWords;
    this.clients = new Map();
  }

  private getRandomColor(): string {
    const colors = [
      '#FFB3B3', // pastel red
      '#BAFFC9', // pastel green
      '#BAE1FF', // pastel blue
      '#FFE4BA', // pastel orange
      '#E2BAFF', // pastel purple
      '#FFDFBA', // pastel peach
      '#FFC9DE', // pastel pink
      '#C4FAF8', // pastel turquoise
      '#DBBAFF', // pastel lavender
      '#FFFFBA'  // pastel yellow
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  addClient(clientId: string, ws: WebSocket) {
    this.clients.set(clientId, { 
      id: clientId, 
      ws,
      color: this.getRandomColor(),
      cursorX: 0,
      cursorY: 0
    });
    
    // Send initial state to new client
    this.sendToClient(clientId, {
      type: 'init',
      words: this.words,
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id: id,
        color: client.color,
        cursorX: client.cursorX,
        cursorY: client.cursorY
      }))
    });

    // Broadcast new client to others
    this.broadcastClients();
  }

  removeClient(clientId: string) {
    this.clients.delete(clientId);
    this.broadcastClients();
  }

  updateCursor(clientId: string, x: number, y: number) {
    const client = this.clients.get(clientId);
    if (client) {
      client.cursorX = x;
      client.cursorY = y;
      this.broadcast({
        type: 'cursorMoved',
        clientId,
        x,
        y,
        color: client.color
      });
    }
  }

  updateWordPosition(wordId: number, x: number, y: number, clientId: string) {
    const word = this.words.find(w => w.id === wordId);
    if (word && word.onCanvas) {
      word.x = x;
      word.y = y;
      this.broadcast({
        type: 'wordMoved',
        wordId,
        x,
        y,
        movedBy: clientId
      });
    }
  }

  addWordToCanvas(wordId: number, x: number, y: number, clientId: string) {
    const word = this.words.find(w => w.id === wordId);
    if (word && !word.onCanvas) {
      word.onCanvas = true;
      word.x = x;
      word.y = y;
      this.broadcast({
        type: 'wordAddedToCanvas',
        wordId,
        x,
        y,
        addedBy: clientId
      });
    }
  }

  removeFromCanvas(wordId: number, clientId: string) {
    const word = this.words.find(w => w.id === wordId);
    if (word && word.onCanvas) {
      word.onCanvas = false;
      word.x = 0;
      word.y = 0;
      this.broadcast({
        type: 'wordRemovedFromCanvas',
        wordId,
        removedBy: clientId
      });
    }
  }

  private broadcast(message: any) { // eslint-disable-line
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  private sendToClient(clientId: string, message: any) { // eslint-disable-line
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcastClients() {
    this.broadcast({
      type: 'clients',
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id: id,
        color: client.color,
        cursorX: client.cursorX,
        cursorY: client.cursorY
      }))
    });
  }
}
