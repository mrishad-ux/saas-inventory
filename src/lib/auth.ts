import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { dbGet, type UserRow } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "saas-inventory-secret-change-in-production";
const JWT_EXPIRES = "7d";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export function signToken(user: { id: number; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserFromToken(token: string): UserRow | null {
  const payload = verifyToken(token);
  if (!payload) return null;

  return dbGet("users", (u: any) => u.id === payload.userId) || null;
}

export async function getAuthUser(): Promise<{
  user: UserRow | null;
  token: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value || null;
    if (!token) return { user: null, token: null };

    const user = getUserFromToken(token);
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}