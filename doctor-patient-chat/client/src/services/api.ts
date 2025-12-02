import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_ENDPOINTS } from '../config';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: '', // We're using full URLs from config
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password }),
  
  register: (name: string, email: string, password: string, role: string) => 
    api.post(API_ENDPOINTS.AUTH.REGISTER, { name, email, password, role }),
  
  getCurrentUser: () => 
    api.get(API_ENDPOINTS.AUTH.USER),
};

// Users API
export const usersAPI = {
  getDoctors: () => 
    api.get(API_ENDPOINTS.USERS.DOCTORS),
  
  updateAvailability: (isAvailable: boolean) => 
    api.put(API_ENDPOINTS.USERS.AVAILABILITY, { isAvailable }),
  
  updateLanguage: (language: string) => 
    api.put(API_ENDPOINTS.USERS.LANGUAGE, { language }),
  
  getUserProfile: (userId: string) => 
    api.get(API_ENDPOINTS.USERS.PROFILE(userId)),
};

// Chat API
export const chatAPI = {
  getConversation: (userId: string) => 
    api.get(API_ENDPOINTS.CHAT.CONVERSATION(userId)),
  
  getConversations: () => 
    api.get(API_ENDPOINTS.CHAT.CONVERSATIONS),
  
  sendMessage: (receiver: string, content: string, isTranslated: boolean, originalLanguage?: string, targetLanguage?: string, audioUrl?: string) => 
    api.post(API_ENDPOINTS.CHAT.MESSAGE, { 
      receiver, 
      content, 
      isTranslated, 
      originalLanguage, 
      targetLanguage,
      audioUrl 
    }),
};

// Speech API
export const speechAPI = {
  transcribeAudio: (audioBlob: Blob, targetLanguage: string) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('targetLanguage', targetLanguage);
    
    return api.post(API_ENDPOINTS.SPEECH.TRANSCRIBE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Upload API
export const uploadAPI = {
  uploadAudio: (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-message.wav');
    
    return api.post(API_ENDPOINTS.UPLOAD.AUDIO, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Helper function to handle API errors
const handleApiError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('API Error - Response:', error.response.data);
    console.error('Status:', error.response.status);
    console.error('Headers:', error.response.headers);
    return {
      success: false,
      error: error.response.data?.message || 'An error occurred',
      status: error.response.status,
    };
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Error - Request:', error.request);
    return {
      success: false,
      error: 'No response from server. Please check your connection.',
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Error - Message:', error.message);
    return {
      success: false,
      error: error.message || 'An error occurred',
    };
  }
};

export const apiService = {
  ...authAPI,
  ...usersAPI,
  ...chatAPI,
  ...speechAPI,
  ...uploadAPI,
  handleApiError,
};

export default apiService;
