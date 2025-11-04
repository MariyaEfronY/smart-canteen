// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, setTokenCookie, clearTokenCookie } from "@/lib/auth"; // ✅ Handles cookies correctly

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  await dbConnect();

  console.log("📩 Login API called");

  try {
    const { email, password, role, dno, staffId } = req.body;
    console.log("🧠 Incoming login request:", req.body);

    let userQuery: any = {};
    if (role === "student" && dno) userQuery = { dno, role: "student" };
    else if (role === "staff" && staffId) userQuery = { staffId, role: "staff" };
    else if (role === "admin" && email) userQuery = { email, role: "admin" };

    console.log("🔍 MongoDB Query:", userQuery);

    const user = await User.findOne(userQuery);
    console.log("🧾 User found:", user ? user._id : "❌ No user");

    if (!user) {
      return res.status(400).json({ message: "User not found or role mismatch" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🧹 Clear any previous token
    clearTokenCookie(res);

    // ✅ Create and set a new token
    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);

    console.log("✅ Login successful for:", user.name);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("💥 Login error:", err);
    res.status(500).json({
      message: "Server error during login",
      error: err.message || "Unknown error",
    });
  }
}
