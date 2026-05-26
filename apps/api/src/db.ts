import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}
