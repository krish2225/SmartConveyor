import mongoose from 'mongoose';

const facilityConfigSchema = new mongoose.Schema({
  facilityId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: 'Bailadila Iron Ore Mine, Chhattisgarh'
  },
  beltLengthMeters: {
    type: Number,
    default: 1200
  },
  beltWidthMm: {
    type: Number,
    default: 1600
  },
  beltRating: {
    type: String,
    default: 'ST-5400 (Steel Cord)'
  },
  nominalSpeedMps: {
    type: Number,
    default: 4.2
  },
  ratedCapacityTph: {
    type: Number,
    default: 2400
  },
  totalJoints: {
    type: Number,
    default: 6
  },
  thresholds: {
    maxVibration: { type: Number, default: 8.5 },
    maxTemp: { type: Number, default: 85.0 },
    minThickness: { type: Number, default: 15.0 },
    dumpSurge: { type: Number, default: 350 }
  }
}, {
  timestamps: true
});

export const FacilityConfig = mongoose.models.FacilityConfig || mongoose.model('FacilityConfig', facilityConfigSchema);
