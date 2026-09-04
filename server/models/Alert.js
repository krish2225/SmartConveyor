import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'WARNING', 'INFO'],
    default: 'INFO'
  },
  source: {
    type: String,
    default: 'Transducer Anomaly Detector'
  },
  jointId: {
    type: String,
    default: 'Joint-01'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'ACTIVE'
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionRequired: {
    type: String,
    default: 'Inspect sensor reading and verify joint condition.'
  },
  acknowledgedBy: {
    type: String,
    default: null
  },
  acknowledgedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: String,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolutionNote: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

alertSchema.index({ facilityId: 1, status: 1, severity: 1 });

export const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
