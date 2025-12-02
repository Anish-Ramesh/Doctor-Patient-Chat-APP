import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, TextField, Paper, Avatar, Badge, useTheme, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Snackbar, Alert, Button } from '@mui/material';
import { ArrowBack, Send, Mic, AttachFile } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import ChatMessage from '../components/chat/ChatMessage';
import AudioRecorder from '../components/chat/AudioRecorder';
import PrescriptionDialog, { Prescription } from '../components/chat/PrescriptionDialog';

interface Message {
  _id: string;
  sender: { _id: string; name: string; avatar?: string };
  receiver?: { _id: string; name: string; avatar?: string };
  content: string;
  audioUrl?: string;
  prescription?: Prescription;
  createdAt: string;
  status: 'sending' | 'sent' | 'failed';
}

interface UserFromAuth {
    _id: string;
    name: string;
    email: string;
    role: 'doctor' | 'patient';
    token: string;
    avatar?: string;
}

const ChatPageWithAudio: React.FC = () => {
  const { userId: chatId } = useParams<{ userId: string }>();
  const { user, initialLoading, token } = useAuth();
  const currentUser = user as UserFromAuth | null;
  const theme = useTheme();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<{_id: string, name: string, role: string} | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState('en');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<{[key: string]: HTMLAudioElement}>({});

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, message);
      setMessage('');
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  // Fetch chat data and other user's info
  useEffect(() => {
    if (!chatId || initialLoading || !token) return;

    const fetchChatData = async () => {
      try {
        const [otherUserRes, messagesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/users/${chatId}`, {
            headers: { 'x-auth-token': token },
          }),
          axios.get(`${API_BASE_URL}/chat/conversation/${chatId}`, {
            headers: { 'x-auth-token': token },
          }),
        ]);

        setOtherUser(otherUserRes.data);
        setMessages(messagesRes.data);
      } catch (error) {
        console.error('Error fetching chat data:', error);
        setOtherUser({ _id: chatId, name: 'User', role: 'user' });
      }
    };

    fetchChatData();
  }, [chatId, initialLoading, token]);
  
  // Get the other user's name (in a real app, this would come from the API)
  const getOtherUserName = () => {
    if (otherUser?.name) return otherUser.name;
    return 'Loading...';
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleFileUpload = async (file: File, content: string = '') => {
    if (!currentUser || !chatId) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('senderId', currentUser._id);
    formData.append('receiverId', chatId);
    if (content) {
      formData.append('content', content);
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      _id: tempId,
      sender: {
        _id: currentUser._id,
        name: currentUser.name,
        avatar: currentUser.avatar,
      },
      content: content || file.name,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/chat/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': token,
          },
        }
      );

      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId 
            ? { ...response.data, status: 'sent' as const }
            : msg
        )
      );
    } catch (error) {
      console.error('File upload failed:', error);
      setUploadError('Failed to upload file. Please try again.');
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId 
            ? { ...msg, status: 'failed' as const }
            : msg
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (content: string, audioBlob?: Blob, prescription?: Prescription) => {
    if ((!content.trim() && !audioBlob) || !currentUser || !chatId || !otherUser) return;

    let audioUrl = '';
    const tempId = `temp-${Date.now()}`;

    // Optimistically add the message to the UI
    const newMessage: Message = {
      _id: tempId,
      sender: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      receiver: { _id: otherUser._id, name: otherUser.name },
      content,
      prescription,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };
    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    try {
      let translation = '';
      if (audioBlob) {
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.mp4');
          formData.append('language', translationLanguage);
          const uploadRes = await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'x-auth-token': token || '',
            },
            timeout: 30000, // 30 second timeout
          });
          if (!uploadRes.data.filePath) {
            throw new Error('No file path in upload response');
          }
          
          audioUrl = uploadRes.data.filePath;
          translation = uploadRes.data.translation || '';
        } catch (error: any) {
          console.error('Error uploading audio:', error);
          const errorMessage = error?.response?.data?.msg || error?.message || 'Unknown error during upload';
          throw new Error(`Failed to upload audio: ${errorMessage}`);
        }
      }

      const res = await axios.post(
        `${API_BASE_URL}/chat/send/${chatId}`,
        { content, audioUrl, translation, prescription },
        { headers: { 'x-auth-token': token || '' } }
      );

      setMessages(prev =>
        prev.map(msg => (msg._id === tempId ? { ...res.data, status: 'sent' } : msg))
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev =>
        prev.map(msg => (msg._id === tempId ? { ...msg, status: 'failed' } : msg))
      );
    }
  };

  const handlePlayAudio = (url: string) => {
    // Stop any currently playing audio
    Object.values(audioRefs.current).forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // Ensure we have a full backend URL for the audio file
    const baseApiOrigin = API_BASE_URL.replace(/\/$/, '').replace(/\/api$/, '');
    const fullUrl = url.startsWith('http') ? url : `${baseApiOrigin}${url}`;
    
    // Play the selected audio
    const audio = new Audio(fullUrl);
    audioRefs.current[fullUrl] = audio;
    audio.play().catch(console.error);
  };

  if (initialLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />

      {/* Error Snackbar */}
      <Snackbar
        open={!!uploadError}
        autoHideDuration={6000}
        onClose={() => setUploadError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setUploadError(null)} severity="error" variant="filled">
          {uploadError}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton color="inherit" onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Avatar sx={{ bgcolor: 'secondary.main' }}>{getInitials(getOtherUserName())}</Avatar>
        <Box>
          <Typography variant="h6">{getOtherUserName()}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {otherUser?.role === 'doctor' ? 'Doctor' : 'Patient'}
          </Typography>
        </Box>
      </Box>
      
      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: theme.palette.grey[50] }}>
        {messages.map(msg => (
          <ChatMessage
            key={msg._id}
            message={msg}
            isOwnMessage={msg.sender._id === currentUser?._id}
            onPlayAudio={msg.audioUrl ? () => handlePlayAudio(msg.audioUrl!) : undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Audio Recorder */}
      {showAudioRecorder && (
        <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <AudioRecorder 
            onSend={(blob) => {
              handleSendMessage('Voice message', blob);
              setShowAudioRecorder(false);
            }}
            onCancel={() => setShowAudioRecorder(false)}
          />
        </Box>
      )}
      
      {currentUser?.role === 'doctor' && (
        <PrescriptionDialog
          open={showPrescriptionDialog}
          onClose={() => setShowPrescriptionDialog(false)}
          onSubmit={(prescription) => {
            handleSendMessage('Prescription', undefined, prescription);
            setShowPrescriptionDialog(false);
          }}
        />
      )}

      {/* Message Input */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="translation-language-label">Language</InputLabel>
          <Select
            labelId="translation-language-label"
            id="translation-language-select"
            value={translationLanguage}
            label="Language"
            onChange={(e: SelectChangeEvent) => setTranslationLanguage(e.target.value as string)}
          >
            <MenuItem value={'en'}>English</MenuItem>
            <MenuItem value={'de'}>German</MenuItem>
            <MenuItem value={'fr'}>French</MenuItem>
            <MenuItem value={'es'}>Spanish</MenuItem>
            <MenuItem value={'ta'}>Tamil</MenuItem>
          </Select>
        </FormControl>
        
        {currentUser?.role === 'doctor' && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowPrescriptionDialog(true)}
            disabled={showAudioRecorder || isUploading}
          >
            Prescription
          </Button>
        )}

        {/* File attachment button */}
        <IconButton 
          onClick={handleAttachFile}
          disabled={showAudioRecorder}
          color={isUploading ? 'primary' : 'default'}
          aria-label="attach file"
        >
          <AttachFile />
        </IconButton>
        
        <TextField
          fullWidth
          variant="outlined"
          id="chat-message-input"
          label="Type a message"
          aria-label="Type a message"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(message)}
          disabled={showAudioRecorder || isUploading}
          size="small"
          sx={{ 
            bgcolor: 'background.paper', 
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
              '&:hover fieldset': {
                border: 'none',
              },
              '&.Mui-focused fieldset': {
                border: 'none',
              },
            },
          }}
          InputLabelProps={{
            shrink: false,
            'aria-hidden': true,
          }}
        />
        
        <IconButton 
          onClick={() => showAudioRecorder ? setShowAudioRecorder(false) : setShowAudioRecorder(true)}
          color={showAudioRecorder ? 'primary' : 'default'}
          disabled={isUploading}
          aria-label={showAudioRecorder ? 'close audio recorder' : 'record audio'}
        >
          <Mic />
        </IconButton>
        
        <IconButton 
          onClick={() => handleSendMessage(message)}
          disabled={!message.trim() || showAudioRecorder || isUploading}
          color="primary"
          aria-label="send message"
        >
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatPageWithAudio;
