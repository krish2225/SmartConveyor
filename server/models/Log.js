import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
    default: () => `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  },
  facilityId: {
    type: String,
    required: true,
    default: 'nmdc-kirandul-cv101'
  },
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'],
    default: 'INFO'
  },
  category: {
    type: String,
    enum: ['SYSTEM', 'SENSOR', 'ANOMALY', 'VISION', 'ALERT', 'EMERGENCY', 'AUDIT', 'MAINTENANCE'],
    default: 'SYSTEM'
  },
  source: {
    type: String,
    default: 'Node Backend Server'
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  jointId: {
    type: String,
    default: null
  },
  user: {
    type: String,
    default: 'System'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

logSchema.index({ facilityId: 1, timestamp: -1 });
logSchema.index({ level: 1, category: 1 });

export const Log = mongoose.models.Log || mongoose.model('Log', logSchema);
