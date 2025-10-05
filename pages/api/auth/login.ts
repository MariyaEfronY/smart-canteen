import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { signToken, setTokenCookie } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  await dbConnect();

  const { dno, staffId, password } = req.body;

  if (!password || (!dno && !staffId))
    return res.status(400).json({ message: "Password and either D.No or Staff ID are required" });

  try {
    const user = await User.findOne({ $or: [{ dno }, { staffId }] });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken({ id: user._id, role: user.role });
    setTokenCookie(res, token);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        dno: user.dno,
        staffId: user.staffId,
      },
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}
