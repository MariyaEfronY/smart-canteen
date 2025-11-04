// lib/mongoose.ts
import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ Missing MONGODB_URI environment variable");
}

// ✅ Use a global cache to avoid multiple connections on Vercel
declare global {
  var _mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  } | undefined;
}

const cached = global._mongoose || { conn: null, promise: null };

export async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) {
    console.log("🟢 Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("🟡 Connecting to MongoDB...");
    cached.promise = mongoose
      .connect(MONGODB_URI!, {
        bufferCommands: false,
        dbName: "yourDatabaseName", // optional, add if needed
      })
      .then((m) => {
        console.log("✅ MongoDB connected successfully");
        return m;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  global._mongoose = cached;
  return cached.conn;
}
