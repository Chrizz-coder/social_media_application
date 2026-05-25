import mongoose from "mongoose";

declare global {
  // Allow the cached connection to survive Next.js hot-reloads in dev
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global._mongooseConn) {
    return global._mongooseConn;
  }

  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("DATABASE_URL environment variable is not defined.");
  }

  global._mongooseConn = await mongoose.connect(uri);
  return global._mongooseConn;
}

/**
 * Returns the underlying MongoClient after ensuring the connection is open.
 * Used by @auth/mongodb-adapter.
 */
export async function getMongoClient() {
  await connectDB();
  return mongoose.connection.getClient();
}
