import mongoose from 'mongoose';

const visionEventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  facilityId: {
    type: String,
    required: true,
    default: 'nmdc-kirandul-cv101'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  cameraLocation: {
    type: String,
    default: 'Feeder Discharge Station Line-Scan #1'
  },
  beltDisplacementMeters: {
    type: Number,
    required: true
  },
  nearestJointId: {
    type: String,
    default: 'Joint-01'
  },
  defectType: {
    type: String,
    default: 'Normal Belt Surface'
  },
  confidence: {
    type: Number,
    default: 0.95
  },
  severity: {
    type: String,
    enum: ['OPTIMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'OPTIMAL'
  },
  boundingBox: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  consecutiveFrames: {
    type: Number,
    default: 1
  },
  isMergedIncident: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

visionEventSchema.index({ facilityId: 1, timestamp: -1 });

export const VisionEvent = mongoose.models.VisionEvent || mongoose.model('VisionEvent', visionEventSchema);
