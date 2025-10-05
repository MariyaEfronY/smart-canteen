import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, setTokenCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();
  const { name, dno, email, password, role } = req.body;

  if (!name || !dno || !email || !password)
    return res.status(400).json({ message: "All fields (name, dno, email, password) are required" });

  try {
    const existing = await User.findOne({ dno });
    if (existing) return res.status(400).json({ message: "D.No already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, dno, email, password: hashed, role: role || "student" });

    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);

    return res.status(201).json({
      message: "Signup successful",
      user: { id: user._id, name: user.name, dno: user.dno, role: user.role },
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}
