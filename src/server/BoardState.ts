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
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
      '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
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
        id: client.id,
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
    if (word) {
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

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
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
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id: client.id,
        color: client.color,
        cursorX: client.cursorX,
        cursorY: client.cursorY
      }))
    });
  }
}
