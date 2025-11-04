// pages/api/auth/signup.ts

import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, setTokenCookie } from "@/lib/auth";
import cookie from "cookie";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  await dbConnect();

  try {
    const { name, email, password, role, dno, staffId, department, phone } = req.body;

    // 🧩 Basic validation
    if (!name || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🧩 Role-based field validation
    if (role === "student" && !dno)
      return res.status(400).json({ message: "D.No required for student signup" });
    if (role === "staff" && !staffId)
      return res.status(400).json({ message: "Staff ID required for staff signup" });
    if (role === "admin" && !email)
      return res.status(400).json({ message: "Email required for admin signup" });

    // 🧩 Duplicate check (role-specific)
    const existing = await User.findOne({
      role,
      ...(role === "admin"
        ? { email }
        : role === "student"
        ? { dno }
        : { staffId }),
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: `A ${role} account with this ID or email already exists.` });
    }

    // 🧩 Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 🧩 Create new user
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

    // 🧩 Create JWT token & set cookie
    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);

    return res.status(201).json({
      message: "Signup successful 🎉",
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ message: "Server error during signup", error: errorMessage });
  }
}
