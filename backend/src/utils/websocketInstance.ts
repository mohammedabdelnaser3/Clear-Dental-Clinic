import { Server as HttpServer } from 'http';
import WebSocketService from './websocket';

let websocketService: WebSocketService | null = null;

export const initWebSocket = (server: HttpServer): WebSocketService => {
  websocketService = new WebSocketService(server);
  return websocketService;
};

export const getWebSocket = (): WebSocketService => {
  if (!websocketService) {
    throw new Error('WebSocketService not initialized');
  }
  return websocketService;
};