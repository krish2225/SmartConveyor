import mongoose from 'mongoose';

const reliabilityLogSchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true,
    default: 'nmdc-kirandul-cv101'
  },
  fleetAverageScore: {
    type: Number,
    default: 90.3
  },
  scores: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

reliabilityLogSchema.index({ facilityId: 1, timestamp: -1 });

export const ReliabilityLog = mongoose.models.ReliabilityLog || mongoose.model('ReliabilityLog', reliabilityLogSchema);
