import React, { useEffect, useRef, useCallback } from 'react';
import { Box, keyframes } from '@mui/material';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  width?: number | string;
  
  /**
   * Height of the visualizer in pixels
   */
  height?: number | string;
  
  /**
   * Color of the waveform
   */
  color?: string;
  
  /**
   * Whether to show a pulsing animation when active
   */
  pulse?: boolean;
  
  /**
   * Class name for custom styling
   */
  className?: string;
}

/**
 * AudioVisualizer component that displays a visual representation of audio data
 * from an AnalyserNode. It can be used to visualize microphone input or audio playback.
 */
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyser,
  width = '100%',
  height = 40,
  color = '#3f51b5',
  pulse = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const lastVolume = useRef(0);
  
  // Smoothing factor for volume changes (0-1, higher = smoother)
  const SMOOTHING_FACTOR = 0.7;
  
  // Animation loop for drawing the visualization
  const draw = useCallback(() => {
    if (!analyser || !canvasRef.current) {
      animationFrameId.current = requestAnimationFrame(draw);
      return;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      animationFrameId.current = requestAnimationFrame(draw);
      return;
    }
    
    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
    
    // Get audio data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += (dataArray[i] / 255) ** 2;
    }
    const rms = Math.sqrt(sum / bufferLength);
    
    // Smooth volume changes
    const smoothedVolume = lastVolume.current * SMOOTHING_FACTOR + rms * (1 - SMOOTHING_FACTOR);
    lastVolume.current = smoothedVolume;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw waveform
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    
    // Adjust bar count based on width to maintain performance
    const skip = Math.max(1, Math.floor(bufferLength / (rect.width / 3)));
    
    for (let i = 0; i < bufferLength; i += skip) {
      const barHeight = (dataArray[i] / 255) * (canvas.height * 0.8);
      
      // Scale height by volume for more dynamic visualization
      const scaledHeight = barHeight * (0.5 + smoothedVolume * 0.5);
      
      // Calculate color based on frequency and volume
      const hue = (i / bufferLength) * 240; // 0-240 for blue to red
      const saturation = 70 + smoothedVolume * 30; // 70-100%
      const lightness = 40 + (1 - smoothedVolume) * 30; // 40-70%
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      // Draw bar with rounded corners
      const y = (canvas.height - scaledHeight) / 2;
      const radius = barWidth * 0.4;
      
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, y + scaledHeight - radius);
      ctx.quadraticCurveTo(x + barWidth, y + scaledHeight, x + barWidth - radius, y + scaledHeight);
      ctx.lineTo(x + radius, y + scaledHeight);
      ctx.quadraticCurveTo(x, y + scaledHeight, x, y + scaledHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      
      x += barWidth + 1;
    }
    
    // Draw center line if volume is very low
    if (smoothedVolume < 0.05) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + Math.sin(Date.now() / 300) * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }
    
    // Continue animation loop
    animationFrameId.current = requestAnimationFrame(draw);
  }, [analyser, color]);
  
  // Start/stop animation when analyser changes
  useEffect(() => {
    if (analyser) {
      animationFrameId.current = requestAnimationFrame(draw);
    }
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser, draw]);
  
  // Pulse animation
  const pulseAnimation = keyframes`
    0% { opacity: 0.6; transform: scale(0.98); }
    50% { opacity: 1; transform: scale(1.02); }
    100% { opacity: 0.6; transform: scale(0.98); }
  `;
  
  return (
    <Box
      className={`audio-visualizer ${className}`}
      sx={{
        width,
        height,
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'rgba(0, 0, 0, 0.1)',
        animation: pulse && analyser ? `${pulseAnimation} 2s infinite ease-in-out` : 'none',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 0 0 2px ${color}33`,
        },
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
};

export default AudioVisualizer;
