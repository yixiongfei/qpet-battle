import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import * as crypto from "crypto";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Hash password using SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Create a new user with username and password
 */
export async function createUser(username: string, password: string, name?: string): Promise<{ success: boolean; message: string; userId?: number }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    // Check if username already exists
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length > 0) {
      return { success: false, message: "Username already exists" };
    }

    // Create new user
    const hashedPassword = hashPassword(password);
    const result = await db.insert(users).values({
      username,
      password: hashedPassword,
      name: name || username,
      role: "user",
      lastSignedIn: new Date(),
    });

    return {
      success: true,
      message: "User created successfully",
      userId: Number(result[0].insertId),
    };
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    return { success: false, message: "Failed to create user" };
  }
}

/**
 * Authenticate user with username and password
 */
export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; message: string; user?: any }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (result.length === 0) {
      return { success: false, message: "User not found" };
    }

    const user = result[0];
    const hashedPassword = hashPassword(password);

    if (user.password !== hashedPassword) {
      return { success: false, message: "Invalid password" };
    }

    // Update last signed in
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

    return {
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSignedIn: user.lastSignedIn,
      },
    };
  } catch (error) {
    console.error("[Database] Failed to authenticate user:", error);
    return { success: false, message: "Authentication failed" };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * OAuth compatibility functions (for backward compatibility)
 * These functions are kept to maintain compatibility with existing OAuth code
 */
export async function getUserByOpenId(openId: string) {
  // OAuth users are not supported in the new system
  // This function is kept for backward compatibility only
  console.warn('[Database] getUserByOpenId called but OAuth is not the primary auth method');
  return undefined;
}

export async function upsertUser(user: any): Promise<void> {
  // OAuth users are not supported in the new system
  // This function is kept for backward compatibility only
  console.warn('[Database] upsertUser called but OAuth is not the primary auth method');
}

// TODO: add feature queries here as your schema grows.
