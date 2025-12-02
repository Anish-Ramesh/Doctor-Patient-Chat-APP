import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Box, TextField, IconButton, InputAdornment, Tooltip, CircularProgress } from '@mui/material';
import { 
  Send as SendIcon, 
  Mic as MicIcon, 
  Cancel as CancelIcon, 
  AttachFile as AttachFileIcon 
} from '@mui/icons-material';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import LanguageSelector from '../common/LanguageSelector';

interface MessageInputProps {
  onSendMessage: (content: string, isTranslated: boolean, originalLanguage?: string, targetLanguage?: string, audioBlob?: Blob) => void;
  onSendFile: (file: File, content?: string) => void;
  isSending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onSendFile, isSending }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isListening, transcript, startListening, stopListening, resetTranscript } = 
    useSpeechRecognition(selectedLanguage);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file, message);
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

  // Handle speech recognition results
  useEffect(() => {
    if (transcript) {
      setMessage(prev => prev + (prev ? ' ' : '') + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const handleSendMessage = () => {
    if ((!message.trim() && !audioBlob) || isSending) return;
    
    if (audioBlob) {
      onSendMessage('', false, selectedLanguage, selectedLanguage, audioBlob);
      setAudioBlob(null);
    } else {
      onSendMessage(message, false);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartRecording = () => {
    setAudioBlob(null);
    startListening();
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
    // In a real app, you would process the recorded audio here
    const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
    setAudioBlob(mockBlob);
  };

  const handleCancelRecording = () => {
    stopListening();
    setIsRecording(false);
    setAudioBlob(null);
  };

  return (
    <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'background.paper' }}>
      {audioBlob && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
          <audio controls>
            <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
          <IconButton onClick={() => setAudioBlob(null)} size="small" sx={{ ml: 1 }}>
            <CancelIcon />
          </IconButton>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          iconOnly
          size="small"
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={!message ? "Type a message..." : ""}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRecording || isSending}
          multiline
          maxRows={4}
          InputProps={{
            sx: { 
              borderRadius: '24px',
              '& .MuiInputBase-input::placeholder': {
                opacity: 1,
                color: 'text.secondary',
              },
            },
            startAdornment: isRecording && (
              <InputAdornment position="start">
                <Box sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  bgcolor: 'error.main',
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                    '100%': { opacity: 1 },
                  },
                }} />
              </InputAdornment>
            ),
          }}
        />

        <Tooltip title={isRecording ? "Stop recording" : "Record voice message"}>
          <IconButton
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isSending}
            color={isRecording ? "error" : "primary"}
          >
            <MicIcon />
          </IconButton>
        </Tooltip>

        <IconButton 
          onClick={handleSendMessage} 
          disabled={(!message.trim() && !audioBlob) || isSending}
          color="primary"
        >
          {isSending ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default MessageInput;
