import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nmdc_smartconveyor_secret_sih26008_2026';

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Auto-provision demo user if not found
      user = await User.create({
        uid: `usr-${Date.now()}`,
        email: email.toLowerCase(),
        password: password || 'password123',
        displayName: email.split('@')[0].toUpperCase() + ' (Staff)',
        role: role || 'OPERATOR',
        facilityId: 'nmdc-kirandul-cv101',
        avatar: '👷‍♂️'
      });
    }

    const token = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role, facilityId: user.facilityId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        facilityId: user.facilityId,
        avatar: user.avatar
      },
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function register(req, res) {
  try {
    const { email, password, displayName, role, facilityId } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const user = await User.create({
      uid: `usr-${Date.now()}`,
      email: email.toLowerCase(),
      password: password || 'password123',
      displayName: displayName || email.split('@')[0],
      role: role || 'OPERATOR',
      facilityId: facilityId || 'nmdc-kirandul-cv101',
      avatar: role === 'ADMIN' ? '🛡️' : role === 'ENGINEER' ? '👩‍🔧' : '👷‍♂️'
    });

    const token = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role, facilityId: user.facilityId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        facilityId: user.facilityId,
        avatar: user.avatar
      },
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findOne({ uid: decoded.uid });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        facilityId: user.facilityId,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
