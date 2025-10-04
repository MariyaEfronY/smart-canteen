// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "../../../lib/mongoose";
import User from "../../../models/User";
import { signToken, setTokenCookie } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  const { name, email, password, role, college } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

  await dbConnect();
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role: role === "admin" ? "admin" : "student", college });

  const token = signToken({ id: user._id, role: user.role });
  setTokenCookie(res, token);

  res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}
