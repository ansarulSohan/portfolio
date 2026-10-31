import mongoose from "mongoose";

// Reuse one connection per process. In dev, hot reload re-evaluates modules,
// so the cache lives on globalThis to avoid opening a new pool on every edit.
type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __mongoose?: ConnectionCache;
};

const cache = (globalForMongoose.__mongoose ??= { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example).",
    );
  }

  cache.promise ??= mongoose.connect(uri, {
    // Fail fast instead of queueing queries while disconnected.
    bufferCommands: false,
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Allow the next call to retry instead of reusing a rejected promise.
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}

/** For scripts: close the pool so the process can exit. */
export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
