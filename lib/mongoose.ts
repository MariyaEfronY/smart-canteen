// lib/mongoose.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var _mongoose: any;
}

const cached = (global as any)._mongoose || { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { }).then((m) => m);
  }
  cached.conn = await cached.promise;
  (global as any)._mongoose = cached;
  return cached.conn;
}
