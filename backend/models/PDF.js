const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  pdfId: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  fileSize: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'indexed', 'error'],
    default: 'uploaded'
  },
  indexedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
pdfSchema.index({ userId: 1, uploadDate: -1 });
// pdfId already has unique: true which creates an index automatically

module.exports = mongoose.model('PDF', pdfSchema);
