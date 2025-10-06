// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "../../../lib/mongoose";
import User from "../../../models/User";
import { getTokenFromReq, verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const token = getTokenFromReq(req);
  if (!token) return res.status(200).json({ user: null });

  const decoded = verifyToken(token);
  if (!decoded) return res.status(200).json({ user: null });

  const user = await User.findById(decoded.id).select("-password");
  if (!user) return res.status(200).json({ user: null });
  
  res.status(200).json({ 
    user,
    // Additional field added
    lastActive: new Date().toISOString()
  });
}