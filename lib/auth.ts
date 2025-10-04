// lib/auth.ts
import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const JWT_SECRET = process.env.JWT_SECRET as jwt.Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
if (!JWT_SECRET) {
  throw new Error("Please define JWT_SECRET in .env.local");
}

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// parse token from cookies (Next API request)
export function getTokenFromReq(req: NextApiRequest): string | null {
  const raw = req.headers.cookie || "";
  const parsed = cookie.parse(raw || "");
  return parsed.token || null;
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export function setTokenCookie(res: NextApiResponse, token: string) {
  const cookieStr = cookie.serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
  res.setHeader("Set-Cookie", cookieStr);
}

export function clearTokenCookie(res: NextApiResponse) {
  const cookieStr = cookie.serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  res.setHeader("Set-Cookie", cookieStr);
}
