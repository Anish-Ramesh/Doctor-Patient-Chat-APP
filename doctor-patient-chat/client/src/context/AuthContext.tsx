import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'doctor' | 'patient';
  token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'doctor' | 'patient') => Promise<void>;
  logout: () => void;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  updateUserLanguage: (language: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = API_BASE_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Set auth token for axios requests and load user
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
        await loadUser();
      } else {
        delete axios.defaults.headers.common['x-auth-token'];
      }
      setInitialLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Load user data
  const loadUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/user`);
      setUser(res.data);
    } catch (err) {
      console.error('Error loading user', err);
      logout();
    }
  };

  // Register user
  const register = async (name: string, email: string, password: string, role: 'doctor' | 'patient') => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        role
      });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      
      // Redirect based on role
      navigate(role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      
      // Redirect based on role
      navigate(res.data.user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  // Update user language preference
  const updateUserLanguage = async (language: string) => {
    try {
      const res = await axios.put(`${API_URL}/users/language`, { language });
      setUser(res.data);
    } catch (err) {
      console.error('Error updating language', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        initialLoading,
        error,
        updateUserLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
