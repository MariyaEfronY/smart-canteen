import { NextApiRequest, NextApiResponse } from "next";
import jwt, { JwtPayload, SignOptions, Secret } from "jsonwebtoken";
import cookie from "cookie";

// Load environment variables
const JWT_SECRET: Secret = process.env.JWT_SECRET as Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("Please define JWT_SECRET in .env.local");
}

// --- Type for JWT Payload ---
export interface TokenPayload extends JwtPayload {
  id: string;
  role: string;
}

// --- Sign a JWT ---
export function signToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as string }; // ✅ cast to string
  return jwt.sign(payload, JWT_SECRET, options);
}

// --- Get token from request cookies ---
export function getTokenFromReq(req: NextApiRequest): string | null {
  const raw = req.headers.cookie || "";
  const parsed = cookie.parse(raw || "");
  return parsed.token || null;
}

// --- Verify token and return decoded payload ---
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// --- Set JWT in HTTP-only cookie ---
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

// --- Clear JWT cookie ---
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
