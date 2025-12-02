const Message = require('../models/Message');
const fs = require('fs');
const path = require('path');

// Helper function to determine file type
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) {
    return 'image';
  } else if (
    mimetype.startsWith('application/pdf') ||
    mimetype.startsWith('application/msword') ||
    mimetype.startsWith('application/vnd.openxmlformats-officedocument') ||
    mimetype.startsWith('text/')
  ) {
    return 'document';
  }
  return 'other';
};

// Upload file and create message with attachment
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const { senderId, receiverId, content = '' } = req.body;
    
    if (!senderId || !receiverId) {
      // Clean up the uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ msg: 'Sender and receiver IDs are required' });
    }

    const fileType = getFileType(req.file.mimetype);
    // Use the correct URL path for file access
    // The URL should include the /api prefix to match the server route
    const fileUrl = `/api/uploads/${req.file.filename}`;

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim(),
      attachment: {
        fileName: req.file.originalname,
        fileUrl,
        fileType,
        fileSize: req.file.size
      }
    });

    await newMessage.save();

    // Populate sender and receiver details
    const message = await Message.findById(newMessage._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    res.json(message);
  } catch (err) {
    console.error('File upload error:', err);
    // Clean up the uploaded file if an error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get file by filename
exports.getFile = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ msg: 'File not found' });
    }
  } catch (err) {
    console.error('File retrieval error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
