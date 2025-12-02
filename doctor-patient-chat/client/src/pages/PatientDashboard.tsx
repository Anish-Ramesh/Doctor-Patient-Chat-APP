import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
  Badge,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  MedicalServices as MedicalServicesIcon, 
  Search as SearchIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Doctor {
  id: string;
  name: string;
  email: string;
  isAvailable: boolean;
  lastSeen: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

const PatientDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const [doctorsRes, conversationsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/users/doctors`),
          axios.get(`${API_BASE_URL}/chat/conversations`)
        ]);

        // Map conversations to doctors
        const conversations = conversationsRes.data || [];
        const doctorsWithChats = doctorsRes.data.map((doctor: any) => {
          const conversation = conversations.find((c: any) => c.user.id === doctor._id);
          return {
            id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            isAvailable: doctor.isAvailable,
            lastSeen: new Date(doctor.lastSeen).toLocaleString(),
            unreadCount: conversation?.unreadCount || 0,
            lastMessage: conversation?.lastMessage?.content || '',
            lastMessageTime: conversation?.lastMessage?.createdAt 
              ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString() 
              : ''
          };
        });

        setDoctors(doctorsWithChats);
      } catch (error) {
        console.error('Error fetching doctors:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDoctors();
    }
  }, [user]);

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartChat = (doctorId: string) => {
    navigate(`/chat/${doctorId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Available Doctors
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Select a doctor to start a consultation
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => logout()}
          >
            Logout
          </Button>
        </Box>

        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        <Paper elevation={2}>
          <List>
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor, index) => (
                <React.Fragment key={doctor.id}>
                  <ListItem 
                    alignItems="flex-start"
                    secondaryAction={
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ChatIcon />}
                        onClick={() => handleStartChat(doctor.id)}
                        disabled={!doctor.isAvailable}
                      >
                        {doctor.isAvailable ? 'Chat' : 'Offline'}
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={doctor.isAvailable ? 'success' : 'error'}
                      >
                        <Avatar>
                          <MedicalServicesIcon />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <Typography component="span" variant="subtitle1">
                            Dr. {doctor.name}
                          </Typography>
                          {doctor.isAvailable && (
                            <Box display="flex" alignItems="center" ml={1}>
                              <CheckCircleIcon color="success" fontSize="small" />
                              <Typography variant="caption" color="text.secondary" ml={0.5}>
                                Online
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            display="block"
                            noWrap
                            sx={{ maxWidth: '500px' }}
                          >
                            {doctor.lastMessage || 'No messages yet'}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            {doctor.lastSeen}
                          </Typography>
                        </>
                      }
                    />
                    {(doctor.unreadCount ?? 0) > 0 && (
                      <Box ml={2}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24, fontSize: '0.75rem' }}>
                          {doctor.unreadCount}
                        </Avatar>
                      </Box>
                    )}
                  </ListItem>
                  {index < filteredDoctors.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))
            ) : (
              <Box textAlign="center" py={4}>
                <PersonIcon color="disabled" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No doctors found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try a different search term' : 'Please check back later'}
                </Typography>
              </Box>
            )}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default PatientDashboard;
