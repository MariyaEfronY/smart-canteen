// lib/auth.ts - ENHANCED VERSION
import { NextApiRequest } from "next";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import cookie from "cookie";
import User from "@/models/User";
import { dbConnect } from "./mongoose";

// ✅ force TypeScript to treat env as Secret
const JWT_SECRET: Secret = (process.env.JWT_SECRET || "supersecret") as Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ---- SIGN ----
export function signToken(payload: Record<string, unknown>): string {
  return (jwt.sign as any)(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// ---- PARSE ----
export function getTokenFromReq(req: NextApiRequest): string | null {
  const raw = req.headers.cookie || "";
  const parsed = cookie.parse(raw || "");
  return parsed.token || null;
}

// ---- VERIFY ----
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ✅ NEW: Verify token with FRESH database role check
export async function verifyTokenWithFreshRole(token: string): Promise<{ id: string; role: string; name: string; email: string } | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Always get fresh user data from database
    await dbConnect();
    const user = await User.findById(decoded.id).select("role name email");
    
    if (!user) {
      return null;
    }

    return {
      id: decoded.id as string,
      role: user.role, // ✅ Always fresh from database
      name: user.name,
      email: user.email
    };
  } catch {
    return null;
  }
}

// ---- SET COOKIE ----
export function setTokenCookie(res: any, token: string): void {
  const cookieStr = cookie.serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  res.setHeader("Set-Cookie", cookieStr);
}

// ---- CLEAR COOKIE ----
export function clearTokenCookie(res: any): void {
  const cookieStr = cookie.serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  res.setHeader("Set-Cookie", cookieStr);
}