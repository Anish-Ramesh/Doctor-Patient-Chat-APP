const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/audio';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /wav|mp3|ogg|m4a/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST api/speech/transcribe
// @desc    Transcribe audio to text
// @access  Private
router.post('/transcribe', auth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No audio file uploaded' });
    }

    const { targetLanguage = 'en' } = req.body;
    const inputFile = req.file.path;
    const outputFile = inputFile + '.wav';

    // Convert audio to WAV format (16kHz, mono, 16-bit) using ffmpeg
    await new Promise((resolve, reject) => {
      const ffmpegCmd = `ffmpeg -i ${inputFile} -acodec pcm_s16le -ac 1 -ar 16000 ${outputFile} -y`;
      
      exec(ffmpegCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('FFmpeg error:', error);
          return reject(new Error('Error processing audio file'));
        }
        resolve();
      });
    });

    // Call the existing speech-to-text API
    const { spawn } = require('child_process');
    const pythonExecutable = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'python' : 'python3');
    const pythonProcess = spawn(pythonExecutable, [
      path.join(__dirname, '../../API/main.py'),
      outputFile,
      targetLanguage
    ]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    return new Promise((resolve) => {
      pythonProcess.on('close', (code) => {
        // Clean up temporary files
        fs.unlinkSync(inputFile);
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }

        if (code !== 0 || error) {
          console.error('Python script error:', error);
          return res.status(500).json({ 
            msg: 'Error transcribing audio',
            error: error || 'Unknown error occurred'
          });
        }

        res.json({
          text: result.trim(),
          language: targetLanguage
        });
        resolve();
      });
    });
  } catch (err) {
    console.error('Transcription error:', err);
    
    // Clean up files in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      msg: 'Server error during transcription',
      error: err.message 
    });
  }
});

module.exports = router;
