import { eq, and } from "drizzle-orm";
import { pets, skills, petSkills, playerStats, onlinePlayers, type Pet, type Skill, type PetSkill } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * 获取用户的宠物
 */
export async function getUserPet(userId: number): Promise<Pet | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pets).where(eq(pets.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 创建用户的宠物
 */
export async function createUserPet(userId: number, name: string): Promise<Pet | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(pets).values({
    userId,
    name,
    level: 1,
    exp: 0,
    maxExp: 100,
    hp: 100,
    maxHp: 100,
    strength: 10,
    agility: 5,
    evolution: 0,
  });

  return getUserPet(userId);
}

/**
 * 更新宠物信息
 */
export async function updatePet(petId: number, data: Partial<Pet>): Promise<Pet | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(pets).set(data).where(eq(pets.id, petId));
  
  const result = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 获取所有技能
 */
export async function getAllSkills(): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(skills);
}

/**
 * 创建初始技能
 */
export async function initializeSkills(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existingSkills = await db.select().from(skills);
  if (existingSkills.length > 0) return;

  const initialSkills = [
    {
      name: "普通攻击",
      description: "对敌人造成基础伤害",
      damage: 10,
      cooldown: 0,
      requiredLevel: 1,
      requiredEvolution: 0,
      icon: "⚔️",
    },
    {
      name: "强力打击",
      description: "造成更强的伤害",
      damage: 20,
      cooldown: 2,
      requiredLevel: 5,
      requiredEvolution: 0,
      icon: "💥",
    },
    {
      name: "旋风斩",
      description: "旋转攻击造成范围伤害",
      damage: 25,
      cooldown: 3,
      requiredLevel: 10,
      requiredEvolution: 1,
      icon: "🌪️",
    },
    {
      name: "终极必杀",
      description: "释放最强力量的攻击",
      damage: 50,
      cooldown: 5,
      requiredLevel: 20,
      requiredEvolution: 2,
      icon: "⭐",
    },
    {
      name: "防御姿态",
      description: "减少受到的伤害",
      damage: 0,
      cooldown: 2,
      requiredLevel: 3,
      requiredEvolution: 0,
      icon: "🛡️",
    },
    {
      name: "生命恢复",
      description: "恢复宠物的生命值",
      damage: 0,
      cooldown: 3,
      requiredLevel: 8,
      requiredEvolution: 1,
      icon: "💚",
    },
  ];

  await db.insert(skills).values(initialSkills);
}

/**
 * 获取宠物已学习的技能
 */
export async function getPetSkills(petId: number): Promise<Skill[]> {
  const db = await getDb();
  if (!db) return [];

  const learnedSkills = await db
    .select({ skillId: petSkills.skillId })
    .from(petSkills)
    .where(eq(petSkills.petId, petId));

  if (learnedSkills.length === 0) return [];

  const skillIds = learnedSkills.map(s => s.skillId);
  const allSkills = await db.select().from(skills);
  
  return allSkills.filter(skill => skillIds.includes(skill.id));
}

/**
 * 学习技能
 */
export async function learnSkill(petId: number, skillId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // 检查是否已学习
    const existing = await db
      .select()
      .from(petSkills)
      .where(and(eq(petSkills.petId, petId), eq(petSkills.skillId, skillId)))
      .limit(1);

    if (existing.length > 0) return false;

    await db.insert(petSkills).values({
      petId,
      skillId,
    });

    return true;
  } catch (error) {
    console.error("Failed to learn skill:", error);
    return false;
  }
}

/**
 * 获取玩家统计
 */
export async function getPlayerStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(playerStats)
    .where(eq(playerStats.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * 创建玩家统计
 */
export async function createPlayerStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(playerStats).values({
    userId,
    totalBattles: 0,
    totalWins: 0,
    currentWinStreak: 0,
    maxWinStreak: 0,
    totalGoldEarned: 0,
    totalExpEarned: 0,
    totalPotionsUsed: 0,
    weaponsCollected: 0,
  });

  return getPlayerStats(userId);
}

/**
 * 更新玩家统计
 */
export async function updatePlayerStats(userId: number, data: Partial<typeof playerStats.$inferInsert>) {
  const db = await getDb();
  if (!db) return null;

  const existing = await getPlayerStats(userId);
  if (!existing) {
    return createPlayerStats(userId);
  }

  await db.update(playerStats).set(data).where(eq(playerStats.userId, userId));
  return getPlayerStats(userId);
}

/**
 * 获取在线玩家数量
 */
export async function getOnlinePlayerCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const result = await db
    .select()
    .from(onlinePlayers);

  return result.filter(p => p.lastHeartbeat > fiveMinutesAgo).length;
}

/**
 * 更新玩家在线状态
 */
export async function updatePlayerOnlineStatus(userId: number, petId: number, level: number, status: string = "idle") {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(onlinePlayers)
    .where(eq(onlinePlayers.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(onlinePlayers)
      .set({
        petId,
        level,
        status,
        lastHeartbeat: new Date(),
      })
      .where(eq(onlinePlayers.userId, userId));
  } else {
    await db.insert(onlinePlayers).values({
      userId,
      petId,
      level,
      status,
    });
  }

  return db
    .select()
    .from(onlinePlayers)
    .where(eq(onlinePlayers.userId, userId))
    .limit(1);
}

/**
 * 获取随机对手
 */
export async function getRandomOpponent(userId: number, currentLevel: number) {
  const db = await getDb();
  if (!db) return null;

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const allOpponents = await db
    .select()
    .from(onlinePlayers);

  const opponents = allOpponents.filter(
    (p) =>
      p.lastHeartbeat > fiveMinutesAgo &&
      p.userId !== userId &&
      p.status === "idle"
  );

  if (opponents.length === 0) return null;

  const sortedOpponents = opponents.sort((a, b) => {
    const aDiff = Math.abs(a.level - currentLevel);
    const bDiff = Math.abs(b.level - currentLevel);
    return aDiff - bDiff;
  });

  return sortedOpponents[0];
}
