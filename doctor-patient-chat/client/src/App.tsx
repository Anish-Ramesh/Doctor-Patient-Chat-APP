import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ChatPage from './pages/ChatPage';
import PrivateRoute from './components/common/PrivateRoute';

const theme = createTheme({
  palette: {
    primary: { 
      main: '#4a6bff', 
      light: '#7d95ff', 
      dark: '#0045cc', 
      contrastText: '#fff' 
    },
    secondary: { 
      main: '#6e3bde', 
      light: '#9d6bff', 
      dark: '#4d2a9a', 
      contrastText: '#fff' 
    },
    error: { main: '#ff3b5c' },
    success: { main: '#00c853' },
    warning: { main: '#ffab00' },
    info: { main: '#00b8d4' },
    background: { 
      default: '#f8fafc', 
      paper: '#fff' 
    },
    text: { 
      primary: '#1e293b', 
      secondary: '#64748b', 
      disabled: '#94a3b8' 
    },
    divider: 'rgba(226, 232, 240, 0.4)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { 
      fontWeight: 700, 
      fontSize: '2.5rem', 
      lineHeight: 1.2, 
      letterSpacing: '-0.02em' 
    },
    h2: { 
      fontWeight: 700, 
      fontSize: '2rem', 
      lineHeight: 1.3, 
      letterSpacing: '-0.015em' 
    },
    h3: { 
      fontWeight: 600, 
      fontSize: '1.75rem', 
      lineHeight: 1.4 
    },
    button: { 
      textTransform: 'none', 
      fontWeight: 600 
    },
  },
  shape: { 
    borderRadius: 8 
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
        },
        body: {
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f5f9',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#cbd5e1',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#94a3b8',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { 
          borderRadius: 8, 
          padding: '10px 24px',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: { 
          boxShadow: 'none',
          '&:hover': { 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg,rgba(25, 118, 210, 0.75) 0%,rgba(7, 42, 200, 0.75) 100%)',
          '&:hover': {
            background: 'linear-gradient(90deg,rgb(25, 118, 210) 0%,rgb(7, 42, 200) 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { 
          borderRadius: 12, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { 
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)' 
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        variant: 'outlined',
      },
      styleOverrides: {
        root: { 
          '& .MuiOutlinedInput-root': { 
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#e2e8f0',
              transition: 'all 0.2s ease-in-out',
            },
            '&:hover fieldset': {
              borderColor: '#cbd5e1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4a6bff',
              boxShadow: '0 0 0 3px rgba(74, 107, 255, 0.15)',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#64748b',
            '&.Mui-focused': {
              color: '#4a6bff',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1e293b',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          padding: '8px 12px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(74, 107, 255, 0.05)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(74, 107, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(74, 107, 255, 0.15)',
            },
          },
        },
      },
    },
  }
});

const App: React.FC = () => {
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<Navigate to="/login" />} />
              <Route 
                path="/patient-dashboard" 
                element={
                  <PrivateRoute allowedRoles={['patient']}>
                    <PatientDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/doctor-dashboard" 
                element={
                  <PrivateRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/chat/:userId" 
                element={
                  <PrivateRoute allowedRoles={['doctor', 'patient']}>
                    <ChatPage />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
