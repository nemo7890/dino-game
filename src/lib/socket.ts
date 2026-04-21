import { io } from 'socket.io-client';

// Connect to the same host natively
export const socket = io(window.location.origin, {
  autoConnect: true
});
