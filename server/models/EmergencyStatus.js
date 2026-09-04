import mongoose from 'mongoose';

const emergencyStatusSchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true,
    unique: true,
    default: 'nmdc-kirandul-cv101'
  },
  emergencyStopActive: {
    type: Boolean,
    default: false
  },
  triggeredBy: {
    type: String,
    default: null
  },
  role: {
    type: String,
    default: null
  },
  reason: {
    type: String,
    default: null
  },
  source: {
    type: String,
    default: null
  },
  triggeredAt: {
    type: Date,
    default: null
  },
  clearedBy: {
    type: String,
    default: 'Site Admin'
  },
  clearedAt: {
    type: Date,
    default: null
  },
  clearRemark: {
    type: String,
    default: 'Physical inspection completed. Conveyor cleared for high-tonnage hauling.'
  }
}, {
  timestamps: true
});

export const EmergencyStatus = mongoose.models.EmergencyStatus || mongoose.model('EmergencyStatus', emergencyStatusSchema);
