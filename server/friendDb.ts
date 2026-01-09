import { eq, and, or } from "drizzle-orm";
import { getDb } from "./db";
import { friendships, friendInvites, users, pets } from "../drizzle/schema";
import type { InsertFriendship, InsertFriendInvite } from "../drizzle/schema";

/**
 * 添加好友请求
 */
export async function addFriend(userId: number, friendId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 检查是否已经是好友或有待处理的请求
  const existing = await db
    .select()
    .from(friendships)
    .where(
      and(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
        )
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Already friends or request pending");
  }

  // 创建好友请求
  await db.insert(friendships).values({
    userId,
    friendId,
    status: "pending",
  });
}

/**
 * 接受好友请求
 */
export async function acceptFriend(userId: number, friendId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 更新请求者的记录为已接受
  await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(
      and(
        eq(friendships.userId, friendId),
        eq(friendships.friendId, userId),
        eq(friendships.status, "pending")
      )
    );

  // 创建反向的好友关系
  await db.insert(friendships).values({
    userId,
    friendId,
    status: "accepted",
  });
}

/**
 * 拒绝好友请求
 */
export async function rejectFriend(userId: number, friendId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.userId, friendId),
        eq(friendships.friendId, userId),
        eq(friendships.status, "pending")
      )
    );
}

/**
 * 删除好友
 */
export async function removeFriend(userId: number, friendId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(friendships)
    .where(
      or(
        and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
        and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
      )
    );
}

/**
 * 获取好友列表
 */
export async function getFriends(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      petId: pets.id,
      petName: pets.name,
      petLevel: pets.level,
      status: friendships.status,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.friendId, users.id))
    .innerJoin(pets, eq(pets.userId, users.id))
    .where(
      and(
        eq(friendships.userId, userId),
        eq(friendships.status, "accepted")
      )
    );

  return result;
}

/**
 * 获取待处理的好友请求
 */
export async function getPendingFriendRequests(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: friendships.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      petId: pets.id,
      petName: pets.name,
      petLevel: pets.level,
      createdAt: friendships.createdAt,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.userId, users.id))
    .innerJoin(pets, eq(pets.userId, users.id))
    .where(
      and(
        eq(friendships.friendId, userId),
        eq(friendships.status, "pending")
      )
    );

  return result;
}

/**
 * 发送好友邀请对战
 */
export async function sendFriendInvite(
  inviterId: number,
  inviteeId: number,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(friendInvites).values({
    inviterId,
    inviteeId,
    status: "pending",
    expiresAt,
  });

  return result;
}

/**
 * 接受好友邀请
 */
export async function acceptFriendInvite(inviteId: number, matchId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(friendInvites)
    .set({ status: "accepted", matchId })
    .where(eq(friendInvites.id, inviteId));
}

/**
 * 拒绝好友邀请
 */
export async function declineFriendInvite(inviteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(friendInvites)
    .set({ status: "declined" })
    .where(eq(friendInvites.id, inviteId));
}

/**
 * 获取待处理的好友邀请
 */
export async function getPendingInvites(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const result = await db
    .select({
      id: friendInvites.id,
      inviterId: users.id,
      inviterName: users.name,
      petId: pets.id,
      petName: pets.name,
      petLevel: pets.level,
      createdAt: friendInvites.createdAt,
      expiresAt: friendInvites.expiresAt,
    })
    .from(friendInvites)
    .innerJoin(users, eq(friendInvites.inviterId, users.id))
    .innerJoin(pets, eq(pets.userId, users.id))
    .where(
      and(
        eq(friendInvites.inviteeId, userId),
        eq(friendInvites.status, "pending")
      )
    );

  // 过滤已过期的邀请
  return result.filter(invite => new Date(invite.expiresAt) > now);
}

/**
 * 检查是否是好友
 */
export async function isFriend(userId: number, friendId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(friendships)
    .where(
      and(
        eq(friendships.userId, userId),
        eq(friendships.friendId, friendId),
        eq(friendships.status, "accepted")
      )
    )
    .limit(1);

  return result.length > 0;
}
