// API Base URL - when frontend and backend are served from the same origin (e.g. on Railway)
export const API_BASE_URL = '/api';

// WebSocket URL - update this in production
export const WS_BASE_URL = 'ws://localhost:5001';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    USER: `${API_BASE_URL}/auth/user`,
  },
  
  // User endpoints
  USERS: {
    DOCTORS: `${API_BASE_URL}/users/doctors`,
    AVAILABILITY: `${API_BASE_URL}/users/availability`,
    LANGUAGE: `${API_BASE_URL}/users/language`,
    PROFILE: (userId: string) => `${API_BASE_URL}/users/${userId}`,
  },
  
  // Chat endpoints
  CHAT: {
    CONVERSATION: (userId: string) => `${API_BASE_URL}/chat/conversation/${userId}`,
    CONVERSATIONS: `${API_BASE_URL}/chat/conversations`,
    MESSAGE: `${API_BASE_URL}/chat/message`,
  },
  
  // Speech endpoints
  SPEECH: {
    TRANSCRIBE: `${API_BASE_URL}/speech/transcribe`,
  },
  
  // Upload endpoints
  UPLOAD: {
    AUDIO: `${API_BASE_URL}/upload/audio`,
  },
};

// WebSocket events
export const WS_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
};

// Default settings
export const DEFAULT_SETTINGS = {
  MESSAGES_PER_PAGE: 50,
  TYPING_TIMEOUT: 3000, // 3 seconds
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 3000, // 3 seconds
  UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB
};

// Supported languages for speech recognition and translation
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

// Get language name by code
export const getLanguageName = (code: string) => {
  const lang = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  return lang ? lang.name : 'Unknown';
};

export default {
  API_BASE_URL,
  WS_BASE_URL,
  API_ENDPOINTS,
  WS_EVENTS,
  DEFAULT_SETTINGS,
  SUPPORTED_LANGUAGES,
  getLanguageName,
};
