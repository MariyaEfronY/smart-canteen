import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, setTokenCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  await dbConnect();

  try {
    const { email, password, role, dno, staffId } = req.body;
    let user;

    // Role-specific lookup
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

    if (!user) return res.status(400).json({ message: "User not found or role mismatch" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Server error during login", error: err.message });
  }
}
