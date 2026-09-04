import { Log } from '../models/Log.js';

export async function getLogs(req, res) {
  try {
    const {
      facilityId,
      level,
      category,
      jointId,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    if (facilityId) {
      query.facilityId = facilityId;
    }

    if (level && level !== 'ALL') {
      query.level = level;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (jointId && jointId !== 'ALL') {
      query.jointId = jointId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { user: { $regex: search, $options: 'i' } },
        { logId: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      Log.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum).lean(),
      Log.countDocuments(query)
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function createLog(req, res) {
  try {
    const { facilityId, level, category, source, message, details, jointId, user } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Log message is required.' });
    }

    const log = await Log.create({
      facilityId: facilityId || 'nmdc-kirandul-cv101',
      level: level || 'INFO',
      category: category || 'SYSTEM',
      source: source || 'Operator Client',
      message,
      details: details || {},
      jointId: jointId || null,
      user: user || 'Operator',
      timestamp: new Date()
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getLogStats(req, res) {
  try {
    const { facilityId } = req.query;
    const match = facilityId ? { facilityId } : {};

    const [byLevel, byCategory, totalCount] = await Promise.all([
      Log.aggregate([
        { $match: match },
        { $group: { _id: '$level', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $match: match },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Log.countDocuments(match)
    ]);

    const levels = { INFO: 0, WARN: 0, ERROR: 0, CRITICAL: 0 };
    byLevel.forEach(item => { if (levels[item._id] !== undefined) levels[item._id] = item.count; });

    const categories = { SYSTEM: 0, SENSOR: 0, ANOMALY: 0, VISION: 0, ALERT: 0, EMERGENCY: 0, AUDIT: 0, MAINTENANCE: 0 };
    byCategory.forEach(item => { if (categories[item._id] !== undefined) categories[item._id] = item.count; });

    res.json({
      success: true,
      stats: {
        total: totalCount,
        levels,
        categories
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function clearLogs(req, res) {
  try {
    const { facilityId, olderThanDays } = req.body;
    const query = {};
    if (facilityId) query.facilityId = facilityId;
    if (olderThanDays) {
      const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
      query.timestamp = { $lt: cutoff };
    }

    const result = await Log.deleteMany(query);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
