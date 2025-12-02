import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL, WS_EVENTS } from '../config';

interface Message {
  id: string;
  conversationId: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface TypingData {
  userId: string;
}

interface UserStatusData {
  userId: string;
}

type MessageCallback = (message: Message) => void;
type TypingCallback = (isTyping: boolean, userId: string) => void;
type UserStatusCallback = (userId: string, isOnline: boolean) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private typingCallbacks: TypingCallback[] = [];
  private userStatusCallbacks: UserStatusCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private isConnected = false;

  // Initialize WebSocket connection
  public connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(WS_BASE_URL, {
      auth: { token },
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
      transports: ['websocket'],
    });

    this.setupEventListeners();
  }

  // Disconnect WebSocket
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a chat room
  public joinRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit(WS_EVENTS.JOIN_ROOM, roomId);
    }
  }

  // Leave a chat room
  public leaveRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit(WS_EVENTS.LEAVE_ROOM, roomId);
    }
  }

  // Send a message
  public sendMessage(message: Message) {
    if (this.socket && this.isConnected) {
      this.socket.emit(WS_EVENTS.SEND_MESSAGE, message);
      return true;
    }
    return false;
  }

  // Notify that user is typing
  public sendTypingStatus(roomId: string, isTyping: boolean) {
    if (this.socket && this.isConnected) {
      this.socket.emit(isTyping ? WS_EVENTS.TYPING : WS_EVENTS.STOP_TYPING, { roomId });
    }
  }

  // Subscribe to new messages
  public onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to typing status changes
  public onTyping(callback: TypingCallback) {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to user status changes
  public onUserStatus(callback: UserStatusCallback) {
    this.userStatusCallbacks.push(callback);
    return () => {
      this.userStatusCallbacks = this.userStatusCallbacks.filter(cb => cb !== callback);
    };
  }

  // Get current connection status
  public get isSocketConnected() {
    return this.isConnected;
  }

  // Set up all event listeners
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      this.handleReconnect();
    });

    // Message events
    this.socket.on(WS_EVENTS.RECEIVE_MESSAGE, (message: Message) => {
      this.messageCallbacks.forEach(callback => callback(message));
    });

    // Typing events
    this.socket.on(WS_EVENTS.TYPING, (data: TypingData) => {
      this.typingCallbacks.forEach(callback => callback(true, data.userId));
    });

    this.socket.on(WS_EVENTS.STOP_TYPING, (data: TypingData) => {
      this.typingCallbacks.forEach(callback => callback(false, data.userId));
    });

    // User status events
    this.socket.on(WS_EVENTS.USER_ONLINE, (userId: string) => {
      this.userStatusCallbacks.forEach(callback => callback(userId, true));
    });

    this.socket.on(WS_EVENTS.USER_OFFLINE, (userId: string) => {
      this.userStatusCallbacks.forEach(callback => callback(userId, false));
    });
  }

  // Handle reconnection logic
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.socket && !this.isConnected) {
          this.socket.connect();
        }
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached. Please refresh the page.');
    }
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();

export default webSocketService;
