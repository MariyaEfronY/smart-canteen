import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, setTokenCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();
  const { dno, password } = req.body;

  if (!dno || !password)
    return res.status(400).json({ message: "D.No and password are required" });

  try {
    const user = await User.findOne({ dno });
    if (!user) return res.status(400).json({ message: "Invalid D.No or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid D.No or password" });

    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);

    return res.status(200).json({
      message: "Login successful",
      user: { id: user._id, name: user.name, dno: user.dno, role: user.role },
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}
