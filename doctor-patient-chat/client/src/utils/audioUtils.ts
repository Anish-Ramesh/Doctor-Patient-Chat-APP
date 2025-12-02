/**
 * Utility functions for handling audio recording and playback
 */

/**
 * Requests microphone access and returns a MediaStream
 */
export const getMicrophoneAccess = async (): Promise<MediaStream> => {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw new Error('Could not access microphone. Please ensure you have granted microphone permissions.');
  }
};

/**
 * Creates an audio context and analyzer node for visualization
 */
export const createAudioContext = (stream: MediaStream) => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  return { audioContext, analyser };
};

/**
 * Records audio from the microphone and returns the audio blob
 */
export const recordAudio = (stream: MediaStream, duration: number = 60000): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      resolve(audioBlob);
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      reject(new Error('Error recording audio'));
    };

    // Start recording
    mediaRecorder.start();

    // Auto-stop after duration (default 1 minute)
    setTimeout(() => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }, duration);
  });
};

/**
 * Plays an audio blob
 */
export const playAudio = (audioBlob: Blob): void => {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play().catch(error => {
    console.error('Error playing audio:', error);
  });
};

/**
 * Formats duration in seconds to MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Converts a Blob to a base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Checks if the browser supports the Web Audio API
 */
export const isAudioAPISupported = (): boolean => {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
};

/**
 * Checks if the browser supports the MediaRecorder API
 */
export const isMediaRecorderSupported = (): boolean => {
  return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm');
};

/**
 * Gets the MIME type for audio recording based on browser support
 */
export const getSupportedMimeType = (): string | undefined => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/ogg',
    'audio/wav',
  ];
  
  return types.find(type => MediaRecorder.isTypeSupported(type));
};
