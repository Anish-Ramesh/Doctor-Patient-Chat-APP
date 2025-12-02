const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const { mongoose } = require('mongoose');
const upload = require('../utils/fileUpload');
const fileController = require('../controllers/fileController');

// @route   GET api/chat/conversation/:userId
// @desc    Get conversation between current user and another user
// @access  Private
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name')
    .populate('receiver', 'name');

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/chat/conversations
// @desc    Get all conversations for the current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all unique user IDs that the current user has chatted with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(req.user.id) },
            { receiver: new mongoose.Types.ObjectId(req.user.id) }
          ]
        }
      },
      {
        $project: {
          participant: {
            $cond: [
              { $eq: ['$sender', new mongoose.Types.ObjectId(req.user.id)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: '$$ROOT'
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $group: {
          _id: '$participant',
          lastMessage: { $first: '$lastMessage' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          user: {
            id: '$user._id',
            name: '$user.name',
            role: '$user.role',
            isAvailable: '$user.isAvailable',
            lastSeen: '$user.lastSeen'
          },
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            isTranslated: '$lastMessage.isTranslated'
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/chat/message
// @desc    Send a new message
// @access  Private
router.post('/message', auth, async (req, res) => {
  const { receiver, content, isTranslated, originalLanguage, targetLanguage, audioUrl } = req.body;

  try {
    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Create new message
    const message = new Message({
      sender: req.user.id,
      receiver,
      content,
      isTranslated,
      originalLanguage,
      targetLanguage,
      audioUrl
    });

    await message.save();

    // Populate sender and receiver info for the response
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/chat/send/:userId
// @desc    Send a message to another user
// @access  Private
router.post('/send/:userId', auth, async (req, res) => {
  const { content, audioUrl, translation, prescription } = req.body;
  const receiverId = req.params.userId;
  const senderId = req.user.id;

  try {
    // Basic validation
    if (!content && !audioUrl) {
      return res.status(400).json({ msg: 'Message content cannot be empty' });
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content || (prescription ? 'Prescription' : ''),
      audioUrl: audioUrl || '',
      translation: translation || '',
      prescription: prescription || undefined
    });

    const savedMessage = await newMessage.save();

    // Populate sender and receiver info for the response
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');

    // TODO: Emit message via socket.io to the receiver

    res.json(populatedMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/chat/upload
// @desc    Upload a file and create a message with attachment
// @access  Private
router.post('/upload', auth, upload.single('file'), fileController.uploadFile);

// @route   GET /api/chat/uploads/:filename
// @desc    Get an uploaded file
// @access  Private
router.get('/uploads/:filename', auth, fileController.getFile);

module.exports = router;
