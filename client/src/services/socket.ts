import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '/');

export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('nexora_token');
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const token = localStorage.getItem('nexora_token');
  if (token) {
    const s = getSocket();
    s.auth = { token };
    if (!s.connected) {
      s.connect();
    }
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
