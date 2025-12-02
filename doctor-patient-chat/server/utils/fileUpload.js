const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use process.env.FILE_UPLOAD_PATH or fallback to /tmp/upload for Vercel
const uploadDir = process.env.FILE_UPLOAD_PATH || path.join(os.tmpdir(), 'upload');

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created uploads directory at: ${uploadDir}`);
    } else {
      console.log(`Using uploads directory at: ${uploadDir}`);
    }
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw new Error('Failed to initialize upload directory');
  }
};

// Initialize directory on require
ensureUploadsDir();

// Clean up old files from /tmp (runs on server start and periodically)
const cleanOldFiles = () => {
  try {
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
};

// Run cleanup on start and then every 6 hours
cleanOldFiles();
setInterval(cleanOldFiles, 6 * 60 * 60 * 1000);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDir(); // Ensure directory exists for each upload
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeFilename}`);
  },
});

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = upload;
