import React from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper, 
  Stack, 
  useTheme,
  Tooltip,
  IconButton,
  Collapse,
  Link,
  Chip
} from '@mui/material';
import { 
  VolumeUp as VolumeUpIcon,
  Translate as TranslateIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  DoneAll as DoneAllIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
  TableChart as SpreadsheetIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { getLanguageName } from '../../config';
import { getFileUrl, getFileIcon } from '../../utils/fileUpload';

// File icon component is now imported from fileUpload.ts

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

interface PrescriptionMedication {
  name: string;
  dosage: string;
  morning: boolean;
  night: boolean;
}

interface Prescription {
  medications: PrescriptionMedication[];
  notes?: string;
}

interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

interface ChatMessageProps {
  message: {
    _id: string;
    sender: {
      _id: string;
      name: string;
      avatar?: string;
      role?: string;
    };
    content: string;
    isTranslated?: boolean;
    originalContent?: string;
    originalLanguage?: string;
    targetLanguage?: string;
    translation?: string;
    audioUrl?: string;
    prescription?: Prescription;
    attachment?: Attachment;
    createdAt: Date | string;
    status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  };
  isOwnMessage: boolean;
  onTranslate?: (messageId: string, targetLanguage?: string) => void;
  onPlayAudio?: (audioUrl: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = (props) => {
  const { message, isOwnMessage, onTranslate, onPlayAudio } = props;
  const theme = useTheme();
  const [showTranslation, setShowTranslation] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [showOriginal, setShowOriginal] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleTranslate = () => {
    if (onTranslate && !message.isTranslated) {
      onTranslate(message._id, 'en'); // Default to English for demo
    } else if (message.isTranslated) {
      setShowOriginal(!showOriginal);
    }
  };

  const handlePlayAudio = () => {
    if (onPlayAudio && message.audioUrl) {
      onPlayAudio(message.audioUrl);
    }
  };

  const formatTime = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'p');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <ScheduleIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />;
      case 'sent':
        return <CheckIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />;
      case 'delivered':
        return (
          <Box sx={{ display: 'flex' }}>
            <CheckIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
            <CheckIcon sx={{ fontSize: '0.8rem', color: 'text.secondary', ml: -0.5 }} />
          </Box>
        );
      case 'read':
        return (
          <Box sx={{ display: 'flex', color: 'primary.main' }}>
            <CheckIcon sx={{ fontSize: '0.8rem' }} />
            <CheckIcon sx={{ fontSize: '0.8rem', ml: -0.5 }} />
          </Box>
        );
      case 'failed':
        return <Typography variant="caption" color="error">Failed</Typography>;
      default:
        return null;
    }
  };

  const renderAttachment = () => {
    if (!message.attachment?.fileUrl) return null;

    const fileUrl = getFileUrl(message.attachment.fileUrl);
    const isImage = message.attachment.fileType === 'image';
    const isPdf = message.attachment.fileType === 'application/pdf';
    const fileName = message.attachment.fileName || 'Download file';
    const fileSize = message.attachment.fileSize ? formatFileSize(message.attachment.fileSize) : '';

    return (
      <Box
        sx={{
          mt: 1,
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider}`,
          maxWidth: '100%',
        }}
      >
        {isImage ? (
          <Box
            component="a"
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'block',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Box
              component="img"
              src={imageError ? '/placeholder-image.png' : fileUrl}
              alt={fileName}
              onError={handleImageError}
              sx={{
                maxWidth: '100%',
                maxHeight: '300px',
                display: 'block',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          </Box>
        ) : (
          <Box
            component="a"
            href={fileUrl}
            download
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              textDecoration: 'none',
              color: isOwnMessage ? 'rgba(255, 255, 255, 0.9)' : 'text.primary',
              '&:hover': {
                backgroundColor: isOwnMessage
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.02)',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                mr: 1.5,
                color: isOwnMessage ? 'primary.main' : 'primary.main',
                backgroundColor: isOwnMessage
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)',
                borderRadius: 1,
              }}
            >
              {getFileIcon(message.attachment.fileType || '')}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {fileName}
              </Typography>
              {fileSize && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                  }}
                >
                  {fileSize}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2,
        px: 2,
      }}
    >
      {!isOwnMessage && (
        <Avatar 
          src={message.sender.avatar}
          alt={message.sender.name}
          sx={{ 
            width: 32, 
            height: 32, 
            mt: 'auto',
            mr: 1,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          }}
        >
          {message.sender.name.charAt(0).toUpperCase()}
        </Avatar>
      )}

      <Box sx={{ maxWidth: '70%' }}>
        {!isOwnMessage && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mb: 0.5, 
              ml: 1, 
              color: 'text.secondary' 
            }}
          >
            {message.sender.name}
          </Typography>
        )}

        <Stack direction={isOwnMessage ? 'row-reverse' : 'row'} spacing={1}>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              borderTopLeftRadius: isOwnMessage ? 12 : 4,
              borderTopRightRadius: isOwnMessage ? 4 : 12,
              bgcolor: isOwnMessage 
                ? theme.palette.primary.main 
                : theme.palette.grey[100],
              color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
              position: 'relative',
            }}
          >
            {message.prescription ? (
              <Box sx={{ minWidth: 260 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Prescription
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                  Doctor: {message.sender.name}
                </Typography>
                <Box
                  sx={{
                    borderRadius: 1.5,
                    border: `1px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)'}`,
                    bgcolor: isOwnMessage ? 'rgba(0,0,0,0.08)' : 'background.paper',
                    p: 1,
                  }}
                >
                  {message.prescription.medications.map((med, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: index === message.prescription!.medications.length - 1 ? 0 : 0.75,
                      }}
                    >
                      <Box sx={{ mr: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {med.name}
                        </Typography>
                        {med.dosage && (
                          <Typography variant="caption" color="text.secondary">
                            {med.dosage}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {med.morning && (
                          <Chip size="small" label="Day" color="primary" variant={isOwnMessage ? 'outlined' : 'filled'} />
                        )}
                        {med.night && (
                          <Chip size="small" label="Night" color="secondary" variant={isOwnMessage ? 'outlined' : 'filled'} />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
                {message.prescription.notes && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, display: 'block', mb: 0.25 }}>
                      Notes
                    </Typography>
                    <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.prescription.notes}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : message.audioUrl ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={handlePlayAudio}
                    size="small"
                    sx={{
                      color: isOwnMessage ? 'inherit' : 'primary.main',
                      p: 0.5,
                      '&:hover': {
                        bgcolor: isOwnMessage
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <VolumeUpIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="body2">Voice message</Typography>
                </Box>
                {message.translation && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.9 }}>
                      {message.translation}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {showOriginal && message.isTranslated && message.originalContent
                    ? message.originalContent
                    : message.content}
                </Typography>
                
                {message.isTranslated && (
                  <Collapse in={showTranslation}>
                    <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                      <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: isOwnMessage ? 'primary.contrastText' : 'text.secondary', opacity: 0.8 }}>
                {formatTime(message.createdAt)}
              </Typography>
              {isOwnMessage && getStatusIcon()}
            </Stack>
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                    </Box>
                  </Collapse>
                )}
              </>
            )}

            {renderAttachment()}

            <Box 
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                mt: 0.5,
                gap: 0.5,
              }}
            >
              {(onTranslate || message.isTranslated) && !message.audioUrl && (
                <Tooltip 
                  title={
                    message.isTranslated 
                      ? showOriginal ? 'Show translation' : 'Show original'
                      : 'Translate message'
                  }
                >
                  <IconButton
                    size="small"
                    onClick={handleTranslate}
                    sx={{
                      color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                      p: 0.25,
                      fontSize: '0.75rem',
                      '&:hover': {
                        color: isOwnMessage ? 'common.white' : 'text.primary',
                        bgcolor: 'transparent',
                      },
                    }}
                  >
                    <TranslateIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}

              <Typography 
                variant="caption" 
                sx={{
                  fontSize: '0.65rem',
                  color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                {formatTime(message.createdAt)}
                {isOwnMessage && getStatusIcon()}
              </Typography>
            </Box>
          </Paper>
        </Stack>
      </Box>

      {isOwnMessage && (
        <Avatar 
          src={message.sender.avatar}
          alt={message.sender.name}
          sx={{ 
            width: 32, 
            height: 32, 
            mt: 'auto',
            ml: 1,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          }}
        >
          {message.sender.name.charAt(0).toUpperCase()}
        </Avatar>
      )}
    </Box>
  );
};

export default ChatMessage;
