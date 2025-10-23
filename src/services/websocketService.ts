import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;
  private retryCount = 0;
  private maxRetries = 5;

  connect() {
    try {
      if (this.socket?.connected) {
        console.log('🔌 WebSocket already connected');
        return;
      }

      console.log('🔌 Connecting to WebSocket...', SOCKET_URL);
      
      this.socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        reconnectionAttempts: this.maxRetries,
        reconnectionDelay: 1000,
        timeout: 10000,
        withCredentials: true,
        forceNew: true,
        path: '/socket.io',
        auth: {
          token: (typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : '')
        }
      });

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected successfully');
        this.retryCount = 0;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 WebSocket connection error:', error);
        this.retryCount++;
        
        if (this.retryCount >= this.maxRetries) {
          console.error('🔌 Max reconnection attempts reached');
          this.socket?.close();
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
      });

    } catch (error) {
      console.error('🔌 WebSocket initialization error:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (!this.socket?.connected) {
      console.warn('🔌 Socket not connected. Attempting to reconnect...');
      this.connect();
      return;
    }
    this.socket.emit(event, data);
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.socket?.off(event, callback);
  }
}

export default new WebSocketService();

