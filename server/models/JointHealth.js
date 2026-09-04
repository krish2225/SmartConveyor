import mongoose from 'mongoose';

const jointHealthSchema = new mongoose.Schema({
  jointId: {
    type: String,
    required: true
  },
  facilityId: {
    type: String,
    required: true,
    default: 'nmdc-kirandul-cv101'
  },
  name: {
    type: String,
    required: true
  },
  positionMeters: {
    type: Number,
    required: true
  },
  healthStatus: {
    type: String,
    enum: ['OPTIMAL', 'ELEVATED_WEAR', 'CRITICAL_DELAMINATION'],
    default: 'OPTIMAL'
  },
  riskScore: {
    type: Number,
    default: 15.0
  },
  estimatedTimeToFailureHours: {
    type: Number,
    default: 4500
  },
  estimatedTimeToFailureDays: {
    type: Number,
    default: 187.5
  },
  ultrasonicThickness: {
    type: Number,
    default: 25.0
  },
  temperature: {
    type: Number,
    default: 42.0
  },
  vibrationRms: {
    type: Number,
    default: 2.1
  },
  acousticEmission: {
    type: Number,
    default: 36.0
  },
  confidence: {
    type: Number,
    default: 0.95
  },
  wearProgress: {
    type: Number,
    default: 0.1
  },
  cycleCount: {
    type: Number,
    default: 14000
  },
  recommendation: {
    type: String,
    default: 'Splice in prime condition. Normal continuous operation.'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

jointHealthSchema.index({ facilityId: 1, jointId: 1 }, { unique: true });

export const JointHealth = mongoose.models.JointHealth || mongoose.model('JointHealth', jointHealthSchema);
