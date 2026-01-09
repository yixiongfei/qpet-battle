import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { pets, skills, petSkills, playerStats } from "../drizzle/schema";
import type { Pet, Skill } from "../drizzle/schema";

/**
 * 战斗状态接口
 */
export interface BattleState {
  playerPetId: number;
  playerPetHp: number;
  playerPetMp: number;
  playerPetMaxMp: number;
  playerSkillCooldowns: Record<number, number>; // 技能ID -> 剩余冷却回合数

  opponentPetId: number;
  opponentPetHp: number;
  opponentPetMp: number;
  opponentPetMaxMp: number;
  opponentSkillCooldowns: Record<number, number>;

  currentRound: number;
  battleLog: string[];
  isFinished: boolean;
  winner?: number; // 1 = 玩家赢, 2 = 对手赢
}

/**
 * 初始化战斗状态
 */
export async function initializeBattle(
  playerPetId: number,
  opponentPetId: number
): Promise<BattleState> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const playerPet = await db
    .select()
    .from(pets)
    .where(eq(pets.id, playerPetId))
    .limit(1);
  const opponentPet = await db
    .select()
    .from(pets)
    .where(eq(pets.id, opponentPetId))
    .limit(1);

  if (playerPet.length === 0 || opponentPet.length === 0) {
    throw new Error("宠物不存在");
  }

  return {
    playerPetId,
    playerPetHp: playerPet[0].hp,
    playerPetMp: playerPet[0].mp,
    playerPetMaxMp: playerPet[0].maxMp,
    playerSkillCooldowns: {},

    opponentPetId,
    opponentPetHp: opponentPet[0].hp,
    opponentPetMp: opponentPet[0].mp,
    opponentPetMaxMp: opponentPet[0].maxMp,
    opponentSkillCooldowns: {},

    currentRound: 1,
    battleLog: [
      `战斗开始！${playerPet[0].name} vs ${opponentPet[0].name}`,
    ],
    isFinished: false,
  };
}

/**
 * 获取宠物可用技能
 */
export async function getPetAvailableSkills(
  petId: number
): Promise<(Skill & { cooldown: number })[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: skills.id,
      name: skills.name,
      description: skills.description,
      damage: skills.damage,
      mpCost: skills.mpCost,
      cooldown: skills.cooldown,
      mpRestore: skills.mpRestore,
      requiredLevel: skills.requiredLevel,
      requiredEvolution: skills.requiredEvolution,
      icon: skills.icon,
      createdAt: skills.createdAt,
    })
    .from(petSkills)
    .innerJoin(skills, eq(petSkills.skillId, skills.id))
    .where(eq(petSkills.petId, petId));

  return result as any;
}

/**
 * 执行技能
 */
export async function executeSkill(
  battleState: BattleState,
  isPlayer: boolean,
  skillId: number
): Promise<{ success: boolean; damage: number; message: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 获取技能信息
  const skillResult = await db
    .select()
    .from(skills)
    .where(eq(skills.id, skillId))
    .limit(1);

  if (skillResult.length === 0) {
    return { success: false, damage: 0, message: "技能不存在" };
  }

  const skill = skillResult[0];
  const petMp = isPlayer ? battleState.playerPetMp : battleState.opponentPetMp;
  const skillCooldowns = isPlayer
    ? battleState.playerSkillCooldowns
    : battleState.opponentSkillCooldowns;

  // 检查蓝量
  if (petMp < skill.mpCost) {
    return { success: false, damage: 0, message: "蓝量不足" };
  }

  // 检查冷却
  if (skillCooldowns[skillId] && skillCooldowns[skillId] > 0) {
    return {
      success: false,
      damage: 0,
      message: `技能冷却中，还需${skillCooldowns[skillId]}回合`,
    };
  }

  // 消耗蓝量
  if (isPlayer) {
    battleState.playerPetMp -= skill.mpCost;
  } else {
    battleState.opponentPetMp -= skill.mpCost;
  }

  // 设置冷却
  skillCooldowns[skillId] = skill.cooldown;

  // 计算伤害（基础伤害 + 随机浮动）
  const baseDamage = skill.damage;
  const damage = Math.max(
    1,
    baseDamage + Math.floor((Math.random() - 0.5) * baseDamage * 0.2)
  );

  return { success: true, damage, message: `使用了${skill.name}，造成${damage}伤害！` };
}

/**
 * 执行防守
 */
export function executeDefend(
  battleState: BattleState,
  isPlayer: boolean
): { success: boolean; message: string } {
  // 恢复一些蓝量
  const mpRestore = 15;
  if (isPlayer) {
    battleState.playerPetMp = Math.min(
      battleState.playerPetMp + mpRestore,
      battleState.playerPetMaxMp
    );
  } else {
    battleState.opponentPetMp = Math.min(
      battleState.opponentPetMp + mpRestore,
      battleState.opponentPetMaxMp
    );
  }

  return {
    success: true,
    message: `防守并恢复了${mpRestore}蓝量`,
  };
}

/**
 * 每回合结束时的处理
 */
export function endRound(battleState: BattleState) {
  // 减少冷却时间
  Object.keys(battleState.playerSkillCooldowns).forEach((skillId) => {
    battleState.playerSkillCooldowns[parseInt(skillId)]--;
  });
  Object.keys(battleState.opponentSkillCooldowns).forEach((skillId) => {
    battleState.opponentSkillCooldowns[parseInt(skillId)]--;
  });

  // 恢复蓝量
  const mpRestore = 10;
  battleState.playerPetMp = Math.min(
    battleState.playerPetMp + mpRestore,
    battleState.playerPetMaxMp
  );
  battleState.opponentPetMp = Math.min(
    battleState.opponentPetMp + mpRestore,
    battleState.opponentPetMaxMp
  );

  battleState.currentRound++;

  // 检查战斗是否结束
  if (battleState.playerPetHp <= 0) {
    battleState.isFinished = true;
    battleState.winner = 2;
    battleState.battleLog.push("对手的宠物获胜！");
  } else if (battleState.opponentPetHp <= 0) {
    battleState.isFinished = true;
    battleState.winner = 1;
    battleState.battleLog.push("您的宠物获胜！");
  }
}

/**
 * 应用伤害
 */
export function applyDamage(
  battleState: BattleState,
  targetIsPlayer: boolean,
  damage: number
) {
  if (targetIsPlayer) {
    battleState.playerPetHp = Math.max(0, battleState.playerPetHp - damage);
  } else {
    battleState.opponentPetHp = Math.max(0, battleState.opponentPetHp - damage);
  }
}

/**
 * 获取AI的行动
 */
export async function getAIAction(
  battleState: BattleState,
  petId: number
): Promise<{
  actionType: "skill" | "defend";
  skillId?: number;
}> {
  const skills = await getPetAvailableSkills(petId);
  const availableSkills = skills.filter((skill) => {
    const mp = battleState.opponentPetMp;
    const cooldown = battleState.opponentSkillCooldowns[skill.id] || 0;
    return mp >= skill.mpCost && cooldown === 0;
  });

  // 50%概率使用技能，50%概率防守
  if (availableSkills.length > 0 && Math.random() > 0.5) {
    const randomSkill = availableSkills[
      Math.floor(Math.random() * availableSkills.length)
    ];
    return { actionType: "skill", skillId: randomSkill.id };
  }

  return { actionType: "defend" };
}
