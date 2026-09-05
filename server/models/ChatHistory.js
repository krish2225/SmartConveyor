import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => `CHAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  facilityId: {
    type: String,
    required: true,
    default: 'nmdc-kirandul-cv101'
  },
  user: {
    type: String,
    default: 'Operator'
  },
  query: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  },
  sources: {
    type: [String],
    default: []
  },
  retrievedContextSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

chatHistorySchema.index({ facilityId: 1, timestamp: -1 });

export const ChatHistory = mongoose.models.ChatHistory || mongoose.model('ChatHistory', chatHistorySchema);
