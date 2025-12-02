import React, { useState, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  Typography, 
  Tooltip, 
  Button,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Mic as MicIcon, 
  Stop as StopIcon, 
  Send as SendIcon,
  Delete as DeleteIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import AudioVisualizer from './AudioVisualizer';

interface AudioRecorderProps {
  onSend: (audioBlob: Blob) => void;
  onCancel?: () => void;
  maxDuration?: number; // in seconds
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSend,
  onCancel,
  maxDuration = 60,
}) => {
  const theme = useTheme();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const {
    isRecording,
    duration,
    formattedDuration,
    audioBlob,
    error,
    analyser,
    startRecording,
    stopRecording,
    reset,
  } = useAudioRecorder();

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  // Auto-stop when max duration is reached
  useEffect(() => {
    if (duration >= maxDuration) {
      stopRecording();
    }
  }, [duration, maxDuration, stopRecording]);

  const handleCancel = () => {
    reset();
    if (onCancel) onCancel();
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      reset();
    }
  };

  const handlePlayPreview = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error('Error playing audio preview:', e));
  };

  return (
    <Box 
      sx={{
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        bgcolor: isRecording 
          ? alpha(theme.palette.error.main, 0.1) 
          : theme.palette.background.paper,
        border: `1px solid ${isRecording ? theme.palette.error.main : theme.palette.divider}`,
        '&:hover': {
          boxShadow: theme.shadows[2],
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        {isRecording ? (
          <Box sx={{ textAlign: 'center' }}>
            <AudioVisualizer 
              analyser={analyser}
              width="100%"
              height={60}
              color={theme.palette.error.main}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
              <Box 
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  mr: 1,
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                    '100%': { opacity: 1 },
                  },
                }} 
              />
              <Typography variant="caption" color="error">
                Recording: {formattedDuration}
              </Typography>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={stopRecording}
                startIcon={<StopIcon />}
                size="small"
              >
                Stop
              </Button>
            </Box>
          </Box>
        ) : audioBlob && audioUrl ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={handlePlayPreview} color="primary" size="small" sx={{ mr: 1 }}>
                <VolumeUpIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2">
                  Audio recorded: {formattedDuration}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Delete recording">
                  <IconButton onClick={handleCancel} size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Send recording">
                  <IconButton onClick={handleSend} color="primary" size="small">
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              py: 2,
              cursor: 'pointer',
            }}
            onClick={startRecording}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
                transition: 'transform 0.2s ease',
                boxShadow: theme.shadows[4],
                '&:hover': {
                  bgcolor: theme.palette.error.dark,
                  transform: 'scale(1.1)',
                },
              }}
            >
              <MicIcon sx={{ color: 'common.white', fontSize: 30 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Tap to record
            </Typography>
          </Box>
        )}
        {error && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
            {error}
          </Typography>
        )}
      </Box>
      {isRecording && (
        <Box sx={{ height: 4, bgcolor: 'divider', position: 'relative', overflow: 'hidden' }}>
          <Box 
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              bgcolor: 'error.main',
              width: `${(duration / maxDuration) * 100}%`,
              transition: 'width 0.1s linear',
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default AudioRecorder;
