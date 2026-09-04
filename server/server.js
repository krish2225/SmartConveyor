import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB, getDBStatus } from './config/db.js';
import { seedDatabase } from './seed/seedDatabase.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import logsRoutes from './routes/logsRoutes.js';
import alertsRoutes from './routes/alertsRoutes.js';
import jointsRoutes from './routes/jointsRoutes.js';
import visionRoutes from './routes/visionRoutes.js';
import reliabilityRoutes from './routes/reliabilityRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/joints', jointsRoutes);
app.use('/api/vision', visionRoutes);
app.use('/api/reliability', reliabilityRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/settings', settingsRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: 'OK',
    service: 'SmartConveyor MERN API Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: {
      type: 'MongoDB',
      connected: dbStatus.connected,
      host: dbStatus.host,
      name: dbStatus.name
    },
    liveTelemetryChannel: {
      provider: 'Firebase Firestore',
      scope: 'Live Physical IoT Hardware Transducers Only'
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'SmartConveyor MERN REST API Server is running.',
    documentation: '/api/health',
    endpoints: [
      '/api/auth',
      '/api/logs',
      '/api/alerts',
      '/api/joints',
      '/api/vision',
      '/api/reliability',
      '/api/reports',
      '/api/emergency',
      '/api/settings'
    ]
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server immediately and connect to DB
const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  SmartConveyor MERN Backend Server Active`);
  console.log(`  Port: http://localhost:${PORT}`);
  console.log(`  MongoDB: Logs, Alerts, Users, Reports, Settings`);
  console.log(`  Firebase: Live Hardware IoT Telemetry Stream Only`);
  console.log(`======================================================\n`);

  connectDB().then((conn) => {
    if (conn) {
      seedDatabase();
    }
  });
});

export default app;
