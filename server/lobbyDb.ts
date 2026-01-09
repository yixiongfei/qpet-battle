import { eq, ne, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  pets,
  playerStatus,
  battleInvites,
  type PlayerStatus,
  type InsertPlayerStatus,
  type BattleInvite,
  type InsertBattleInvite,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * 更新玩家在线状态
 */
export async function updatePlayerStatus(
  userId: number,
  status: "idle" | "matching" | "inBattle" | "offline"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const isOnline = status !== "offline" ? 1 : 0;

  await db
    .insert(playerStatus)
    .values({
      userId,
      isOnline,
      currentStatus: status,
      lastSeenAt: new Date(),
    })
    .onDuplicateKeyUpdate({
      set: {
        isOnline,
        currentStatus: status,
        lastSeenAt: new Date(),
      },
    });
}

/**
 * 获取在线玩家列表
 */
export async function getOnlinePlayersList(
  currentUserId: number,
  limit: number = 20
): Promise<
  Array<{
    userId: number;
    userName: string;
    petName: string;
    petLevel: number;
    petImageUrl: string | null;
    status: string;
    lastSeenAt: Date;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      userId: users.id,
      userName: users.name,
      petName: pets.name,
      petLevel: pets.level,
      petImageUrl: pets.imageUrl,
      status: playerStatus.currentStatus,
      lastSeenAt: playerStatus.lastSeenAt,
    })
    .from(users)
    .innerJoin(pets, eq(users.id, pets.userId))
    .innerJoin(playerStatus, eq(users.id, playerStatus.userId))
    .where(
      and(
        ne(users.id, currentUserId),
        eq(playerStatus.isOnline, 1)
      )
    )
    .limit(limit);

  return result as any;
}

/**
 * 发送对战邀请
 */
export async function sendBattleInvite(
  inviterId: number,
  inviteeId: number,
  expiresAt: Date
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(battleInvites).values({
    inviterId,
    inviteeId,
    status: "pending",
    expiresAt,
  });

  return String(result[0]?.insertId || "");
}

/**
 * 获取待处理的对战邀请
 */
export async function getPendingBattleInvites(
  userId: number
): Promise<
  Array<{
    id: number;
    inviterId: number;
    inviterName: string;
    inviterPetName: string;
    inviterPetLevel: number;
    expiresAt: Date;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: battleInvites.id,
      inviterId: battleInvites.inviterId,
      inviterName: users.name,
      inviterPetName: pets.name,
      inviterPetLevel: pets.level,
      expiresAt: battleInvites.expiresAt,
    })
    .from(battleInvites)
    .innerJoin(users, eq(battleInvites.inviterId, users.id))
    .innerJoin(pets, eq(users.id, pets.userId))
    .where(
      and(
        eq(battleInvites.inviteeId, userId),
        eq(battleInvites.status, "pending")
      )
    );

  return result as any;
}

/**
 * 接受对战邀请
 */
export async function acceptBattleInvite(
  inviteId: number,
  battleId: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(battleInvites)
    .set({
      status: "accepted",
      battleId,
      updatedAt: new Date(),
    })
    .where(eq(battleInvites.id, inviteId));
}

/**
 * 拒绝对战邀请
 */
export async function declineBattleInvite(inviteId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(battleInvites)
    .set({
      status: "declined",
      updatedAt: new Date(),
    })
    .where(eq(battleInvites.id, inviteId));
}

/**
 * 标记过期的邀请
 */
export async function expireBattleInvites(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(battleInvites)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(battleInvites.status, "pending"),
        // 使用原生SQL比较时间
      )
    );
}

/**
 * 获取玩家的宠物信息
 */
export async function getPlayerPetInfo(userId: number): Promise<{
  petName: string;
  petLevel: number;
  petImageUrl: string | null;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      petName: pets.name,
      petLevel: pets.level,
      petImageUrl: pets.imageUrl,
    })
    .from(pets)
    .where(eq(pets.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
