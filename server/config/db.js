import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartconveyor';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected Successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${uri}: ${error.message}`);
    console.warn(`[MongoDB Notice] Make sure MongoDB daemon is running if you want local database persistence.`);
    return null;
  }
}

export function getDBStatus() {
  return {
    connected: isConnected || mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || '127.0.0.1',
    name: mongoose.connection.name || 'smartconveyor',
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartconveyor'
  };
}
