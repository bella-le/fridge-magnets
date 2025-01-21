export interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  rotation?: number;
  onCanvas: boolean;
}

export interface Client {
  id: string;
  color: string;
  cursorX: number;
  cursorY: number;
}
