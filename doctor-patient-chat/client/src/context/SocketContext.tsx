import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { WS_BASE_URL } from '../config';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

const SOCKET_URL = WS_BASE_URL;

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (token && !socketRef.current) {
      // Initialize socket connection with auth token
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      // Handle connection events
      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
      });

      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }

    // Cleanup on unmount or when token changes
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  return useContext(SocketContext);
};

export default SocketContext;
