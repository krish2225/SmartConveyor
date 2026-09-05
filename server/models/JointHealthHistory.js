import mongoose from 'mongoose';

const jointHealthHistorySchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true,
    default: 'nmdc-kirandul-cv101',
    index: true
  },
  jointId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  healthScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 100
  },
  status: {
    type: String,
    enum: ['OPTIMAL', 'ELEVATED_WEAR', 'CRITICAL_DELAMINATION'],
    default: 'OPTIMAL'
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  estimatedTimeToFailureDays: {
    type: Number,
    default: 180
  },
  estimatedTimeToFailureHours: {
    type: Number,
    default: 4320
  },
  ultrasonicThickness: {
    type: Number,
    default: 25.0
  },
  temperature: {
    type: Number,
    default: 40.0
  },
  vibrationRms: {
    type: Number,
    default: 2.0
  },
  acousticEmission: {
    type: Number,
    default: 35.0
  },
  wearProgress: {
    type: Number,
    default: 0.1
  }
}, {
  timestamps: false
});

// TTL Index: Automatically expire historical snapshots older than 7 days
jointHealthHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Compound index for high-speed chronological range lookups
jointHealthHistorySchema.index({ facilityId: 1, jointId: 1, timestamp: 1 });
jointHealthHistorySchema.index({ facilityId: 1, timestamp: 1 });

export const JointHealthHistory = mongoose.models.JointHealthHistory || mongoose.model('JointHealthHistory', jointHealthHistorySchema);
