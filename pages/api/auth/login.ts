// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, setTokenCookie, clearTokenCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  console.log("📩 Login API called");

  try {
    await dbConnect();

    const { email, password, role, dno, staffId } = req.body;
    console.log("🧠 Incoming login request:", { role, email, dno, staffId });

    let user;

    // 🔍 Role-based lookup
    if (role === "student") {
      if (!dno) return res.status(400).json({ message: "D.No required" });
      user = await User.findOne({ dno, role: "student" });
    } else if (role === "staff") {
      if (!staffId) return res.status(400).json({ message: "Staff ID required" });
      user = await User.findOne({ staffId, role: "staff" });
    } else if (role === "admin") {
      if (!email) return res.status(400).json({ message: "Email required" });
      user = await User.findOne({ email, role: "admin" });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    // 🚫 User not found
    if (!user) {
      console.log("❌ User not found or role mismatch");
      return res.status(400).json({ message: "User not found or role mismatch" });
    }

    // 🔒 Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Invalid password for user:", user.name);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🧹 Clear any existing token
    clearTokenCookie(res);

    // ✅ Sign & set token
    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);

    console.log("✅ Login success for user:", user.name);

    // ✅ Respond with safe data
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("💥 Login API error:", errorMessage);
    return res.status(500).json({
      message: "Server error during login",
      error: errorMessage,
    });
  }
}
