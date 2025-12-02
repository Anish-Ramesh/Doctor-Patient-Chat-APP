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
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Search as SearchIcon,
  Chat as ChatIcon,
  MedicalServices as MedicalServicesIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format, parseISO, isValid } from 'date-fns';

interface Patient {
  id: string;
  name: string;
  email: string;
  lastSeen: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

const DoctorDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/chat/conversations`);
        const conversations = response.data || [];
        
                const patientsList = conversations.map((conversation: any) => {
          const lastSeenDate = conversation.user.lastSeen ? parseISO(conversation.user.lastSeen) : null;
          const lastMessageDate = conversation.lastMessage?.createdAt ? parseISO(conversation.lastMessage.createdAt) : null;

          return {
            id: conversation.user.id,
            name: conversation.user.name,
            email: conversation.user.email,
            lastSeen: lastSeenDate && isValid(lastSeenDate) ? format(lastSeenDate, 'p, dd/MM/yy') : 'N/A',
            unreadCount: conversation.unreadCount || 0,
            lastMessage: conversation.lastMessage?.content || '',
            lastMessageTime: lastMessageDate && isValid(lastMessageDate) 
              ? format(lastMessageDate, 'p')
              : ''
          }
        });

        setPatients(patientsList);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPatients();
      updateAvailability();
    }
  }, [user]);

  const updateAvailability = async () => {
    try {
      await axios.put(`${API_BASE_URL}/users/availability`, { isAvailable });
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleAvailabilityChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = event.target.checked;
    setIsAvailable(newStatus);
    
    try {
      await axios.put(`${API_BASE_URL}/users/availability`, { isAvailable: newStatus });
    } catch (error) {
      console.error('Error updating availability:', error);
      setIsAvailable(!newStatus); // Revert on error
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartChat = (patientId: string) => {
    navigate(`/chat/${patientId}`);
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
              My Patients
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your patient consultations
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Switch 
                  checked={isAvailable} 
                  onChange={handleAvailabilityChange}
                  color="primary"
                />
              }
              label={
                <Box display="flex" alignItems="center">
                  <Box 
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: isAvailable ? 'success.main' : 'error.main',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </Typography>
                </Box>
              }
            />
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => logout()}
            >
              Logout
            </Button>
          </Box>
        </Box>

        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search patients..."
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
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient, index) => (
                <React.Fragment key={patient.id}>
                  <ListItem 
                    alignItems="flex-start"
                    secondaryAction={
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ChatIcon />}
                        onClick={() => handleStartChat(patient.id)}
                      >
                        Chat
                      </Button>
                    }
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color="success"
                      >
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <Typography component="span" variant="subtitle1">
                            {patient.name}
                          </Typography>
                          <Box display="flex" alignItems="center" ml={1}>
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography variant="caption" color="text.secondary" ml={0.5}>
                              Online
                            </Typography>
                          </Box>
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
                            {patient.lastMessage || 'No messages yet'}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            {patient.lastSeen}
                          </Typography>
                        </>
                      }
                    />
                    {(patient.unreadCount ?? 0) > 0 && (
                      <Box ml={2}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24, fontSize: '0.75rem' }}>
                          {patient.unreadCount}
                        </Avatar>
                      </Box>
                    )}
                  </ListItem>
                  {index < filteredPatients.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))
            ) : (
              <Box textAlign="center" py={4}>
                <PersonIcon color="disabled" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No patients found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try a different search term' : 'Patients who message you will appear here'}
                </Typography>
              </Box>
            )}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default DoctorDashboard;
