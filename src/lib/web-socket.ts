// WebSocket configuration for real-time features
export const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://your-domain.com'
  : 'ws://127.0.0.1:3000';

export const socketOptions = {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000,
};