import { useState, useRef, useEffect, useCallback } from 'react';
import { createAudioContext, formatDuration } from '../utils/audioUtils';

interface UseAudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
}

export const useAudioRecorder = ({ onRecordingComplete }: UseAudioRecorderProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<{ audioContext: AudioContext; analyser: AnalyserNode } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.audioContext.close();
      audioContextRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setDuration(0);
    setAudioBlob(null);
    setError(null);
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    reset();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = createAudioContext(stream);
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
                const mimeType = MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        setAudioBlob(blob);
        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
        cleanup();
      };

      recorder.onerror = (event) => {
        const recorderError = (event as any).error as DOMException;
        setError(`Recording error: ${recorderError.name} - ${recorderError.message}`);
        cleanup();
      };

      recorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Could not start recording. Please allow microphone access.');
      console.error('Error starting recording:', err);
      cleanup();
    }
  }, [reset, onRecordingComplete, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isRecording,
    duration,
    formattedDuration: formatDuration(duration),
    audioBlob,
    error,
    analyser: audioContextRef.current?.analyser ?? null,
    startRecording,
    stopRecording,
    reset,
  };
};
