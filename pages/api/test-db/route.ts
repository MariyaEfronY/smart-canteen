// app/api/test-db/route.ts
import { dbConnect } from "@/lib/mongoose";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    await dbConnect();

    // Optional: list all collections to verify actual DB access
    let collections: { name: string }[] = [];
    if (mongoose.connection.db) {
      collections = await mongoose.connection.db.listCollections().toArray();
    }
    
    return NextResponse.json({
      success: true,
      message: "✅ MongoDB connected successfully",
      dbName: mongoose.connection.name,
      collections: collections.map(c => c.name)
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "❌ MongoDB connection failed",
      error: error.message
    }, { status: 500 });
  }
}
