const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return !this.attachment && !this.prescription;
    }
  },
  attachment: {
    fileName: {
      type: String,
      default: ''
    },
    fileUrl: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      enum: ['image', 'document', 'other'],
      default: 'other'
    },
    fileSize: {
      type: Number,
      default: 0
    }
  },
  translation: {
    type: String,
    default: ''
  },
  isTranslated: {
    type: Boolean,
    default: false
  },
  originalLanguage: {
    type: String,
    default: 'en'
  },
  targetLanguage: {
    type: String,
    default: 'en'
  },
  audioUrl: {
    type: String,
    default: ''
  },
  prescription: {
    medications: [
      {
        name: {
          type: String,
          required: true,
          trim: true
        },
        dosage: {
          type: String,
          default: ''
        },
        morning: {
          type: Boolean,
          default: false
        },
        night: {
          type: Boolean,
          default: false
        }
      }
    ],
    notes: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
