import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['SHIFT_AUDIT', 'PREDICTIVE_RUL', 'VIBRATION_AUDIT', 'VISION_SUMMARY', 'SENSOR_RELIABILITY_INDEX', 'DUMP_FILTER_LOG', 'CUSTOM'],
    default: 'SHIFT_AUDIT'
  },
  generatedBy: {
    type: String,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  totalTonnage: {
    type: String,
    default: '428,500 Tons'
  },
  overallRiskScore: {
    type: Number,
    default: 25.0
  },
  status: {
    type: String,
    enum: ['FILED', 'APPROVED', 'PENDING_REVIEW'],
    default: 'APPROVED'
  },
  snapshotData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

reportSchema.index({ facilityId: 1, generatedAt: -1 });

export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
