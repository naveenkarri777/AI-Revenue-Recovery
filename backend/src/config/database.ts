import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;
let memoryServer: any = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  // 1. Attempt connection to configured MONGODB_URI
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Warning: MongoDB at '${env.MONGODB_URI}' unreachable (${(error as Error).message}).`);

    // 2. Fallback to in-memory MongoDB in dev/test
    if (env.NODE_ENV !== 'production') {
      try {
        console.log('🔄 Spinning up in-memory MongoDB server fallback...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const uri = memoryServer.getUri();

        const conn = await mongoose.connect(uri);
        isConnected = true;
        console.log(`✅ Connected to In-Memory MongoDB: ${uri}`);
        return conn;
      } catch (memErr) {
        console.error('❌ In-memory MongoDB failed to initialize:', (memErr as Error).message);
        throw error;
      }
    }

    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  isConnected = false;
  console.log('MongoDB disconnected');
}

