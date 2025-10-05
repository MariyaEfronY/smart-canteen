import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, setTokenCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  await dbConnect();

  try {
    const { name, email, password, role, dno, staffId, department, phone } = req.body;

    if (!name || !password || !role)
      return res.status(400).json({ message: "Missing required fields" });

    // Validation per role
    if (role === "student" && !dno)
      return res.status(400).json({ message: "D.No required for student signup" });

    if (role === "staff" && !staffId)
      return res.status(400).json({ message: "Staff ID required for staff signup" });

    if (role === "admin" && !email)
      return res.status(400).json({ message: "Email required for admin signup" });

    // Check duplicates
    const existing = await User.findOne(
      role === "admin"
        ? { email }
        : role === "student"
        ? { dno }
        : { staffId }
    );
    if (existing) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      dno,
      staffId,
      department,
      phone,
    });

    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);

    res.status(201).json({
      message: "Signup successful",
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err: any) {
  console.error("Signup error:", err);
  res.status(500).json({
    message: "Server error during signup",
    error: err.message,
    stack: err.stack, // 👈 add this for debugging
  });
}
}
