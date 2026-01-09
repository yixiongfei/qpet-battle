import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Parse simple_auth_session cookie
    const cookies = opts.req.headers.cookie || '';
    const sessionCookie = cookies
      .split(';')
      .find((c) => c.trim().startsWith('simple_auth_session='));

    if (sessionCookie) {
      const sessionValue = sessionCookie.split('=')[1];
      const session = JSON.parse(decodeURIComponent(sessionValue));
      
      if (session.userId) {
        user = await getUserById(session.userId) || null;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.warn('[Auth] Failed to parse session:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
