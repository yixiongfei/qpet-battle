import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 宠物表 - 存储玩家的宠物信息
 */
export const pets = mysqlTable("pets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  level: int("level").default(1).notNull(),
  exp: int("exp").default(0).notNull(),
  maxExp: int("maxExp").default(100).notNull(),
  hp: int("hp").default(100).notNull(),
  maxHp: int("maxHp").default(100).notNull(),
  mp: int("mp").default(50).notNull(),
  maxMp: int("maxMp").default(50).notNull(),
  strength: int("strength").default(10).notNull(),
  agility: int("agility").default(5).notNull(),
  evolution: int("evolution").default(0).notNull(),
  imageUrl: varchar("imageUrl", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pet = typeof pets.$inferSelect;
export type InsertPet = typeof pets.$inferInsert;

/**
 * 技能表 - 存储所有可用的技能
 */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  description: text("description"),
  damage: int("damage").default(0).notNull(),
  mpCost: int("mpCost").default(0).notNull(),
  cooldown: int("cooldown").default(0).notNull(),
  mpRestore: int("mpRestore").default(0).notNull(),
  requiredLevel: int("requiredLevel").default(1).notNull(),
  requiredEvolution: int("requiredEvolution").default(0).notNull(),
  icon: varchar("icon", { length: 255 }).default("⚔️").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

/**
 * 宠物技能表 - 存储宠物已学习的技能
 */
export const petSkills = mysqlTable("petSkills", {
  id: int("id").autoincrement().primaryKey(),
  petId: int("petId").notNull(),
  skillId: int("skillId").notNull(),
  learnedAt: timestamp("learnedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PetSkill = typeof petSkills.$inferSelect;
export type InsertPetSkill = typeof petSkills.$inferInsert;

/**
 * 玩家统计表 - 存储玩家的游戏统计数据
 */
export const playerStats = mysqlTable("playerStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalBattles: int("totalBattles").default(0).notNull(),
  totalWins: int("totalWins").default(0).notNull(),
  currentWinStreak: int("currentWinStreak").default(0).notNull(),
  maxWinStreak: int("maxWinStreak").default(0).notNull(),
  totalGoldEarned: int("totalGoldEarned").default(0).notNull(),
  totalExpEarned: int("totalExpEarned").default(0).notNull(),
  totalPotionsUsed: int("totalPotionsUsed").default(0).notNull(),
  weaponsCollected: int("weaponsCollected").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerStats = typeof playerStats.$inferSelect;
export type InsertPlayerStats = typeof playerStats.$inferInsert;

/**
 * 在线玩家表 - 存储当前在线的玩家
 */
export const onlinePlayers = mysqlTable("onlinePlayers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  petId: int("petId").notNull(),
  level: int("level").default(1).notNull(),
  status: varchar("status", { length: 32 }).default("idle").notNull(),
  lastHeartbeat: timestamp("lastHeartbeat").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OnlinePlayer = typeof onlinePlayers.$inferSelect;
export type InsertOnlinePlayer = typeof onlinePlayers.$inferInsert;

/**
 * 好友关系表 - 存储玩家之间的好友关系
 */
export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  friendId: int("friendId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "blocked"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = typeof friendships.$inferInsert;

/**
 * 好友邀请表 - 存储好友邀请对战的记录
 */
export const friendInvites = mysqlTable("friendInvites", {
  id: int("id").autoincrement().primaryKey(),
  inviterId: int("inviterId").notNull(),
  inviteeId: int("inviteeId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "expired"]).default("pending").notNull(),
  matchId: varchar("matchId", { length: 255 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FriendInvite = typeof friendInvites.$inferSelect;
export type InsertFriendInvite = typeof friendInvites.$inferInsert;
