import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memServer?: unknown;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2500,
    };

    cached.promise = (async () => {
      try {
        const instance = await mongoose.connect(MONGODB_URI, opts);
        return instance;
      } catch (err: unknown) {
        const errObj = err as { message?: string; name?: string };
        // If local 127.0.0.1 daemon is not running during local development, spin up in-memory MongoDB
        if (
          (errObj?.message?.includes("ECONNREFUSED") || errObj?.name === "MongooseServerSelectionError") &&
          (MONGODB_URI.includes("127.0.0.1") || MONGODB_URI.includes("localhost"))
        ) {
          console.warn(
            "Local MongoDB daemon not running on port 27017. Starting embedded in-memory MongoDB instance for local prototype..."
          );
          const { MongoMemoryServer } = await import("mongodb-memory-server");
          if (!cached.memServer) {
            cached.memServer = await MongoMemoryServer.create();
          }
          const memUri = (cached.memServer as { getUri: () => string }).getUri();
          const instance = await mongoose.connect(memUri, { bufferCommands: false });
          return instance;
        }
        throw err;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
