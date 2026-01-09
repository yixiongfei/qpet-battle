/**
 * 种族技能系统
 * 每个种族有4个独特的技能，在不同进化阶段解锁
 */

export type SkillType = "attack" | "defense" | "recovery" | "special";

export interface RaceSkillConfig {
  name: string;
  description: string;
  type: SkillType;
  mpCost: number;
  cooldown: number; // 冷却回合数
  minEvolution: number; // 最小进化阶段
  baseDamage?: number; // 基础伤害（攻击型）
  defenseBoost?: number; // 防御提升（防御型）
  recoveryAmount?: number; // 恢复量（恢复型）
}

/**
 * 人族技能
 */
export const HUMAN_SKILLS: Record<string, RaceSkillConfig> = {
  fireball: {
    name: "烈火斩",
    description: "释放烈火，对敌人造成伤害",
    type: "attack",
    mpCost: 20,
    cooldown: 1,
    minEvolution: 0,
    baseDamage: 30,
  },
  frostbolt: {
    name: "冰冻术",
    description: "冰冻敌人，降低其攻击力",
    type: "special",
    mpCost: 25,
    cooldown: 2,
    minEvolution: 1,
    baseDamage: 25,
  },
  magicShield: {
    name: "魔法盾",
    description: "创建魔法屏障，提高防御",
    type: "defense",
    mpCost: 15,
    cooldown: 2,
    minEvolution: 0,
    defenseBoost: 15,
  },
  arcanePulse: {
    name: "秘法脉冲",
    description: "释放强大的秘法能量",
    type: "attack",
    mpCost: 40,
    cooldown: 3,
    minEvolution: 2,
    baseDamage: 50,
  },
};

/**
 * 兽族技能
 */
export const BEAST_SKILLS: Record<string, RaceSkillConfig> = {
  slash: {
    name: "野蛮斩击",
    description: "用利爪进行猛烈斩击",
    type: "attack",
    mpCost: 15,
    cooldown: 1,
    minEvolution: 0,
    baseDamage: 40,
  },
  roar: {
    name: "野兽咆哮",
    description: "发出震撼的咆哮，提高攻击力",
    type: "special",
    mpCost: 20,
    cooldown: 2,
    minEvolution: 1,
    baseDamage: 20,
  },
  ironSkin: {
    name: "铁皮防御",
    description: "强化皮肤，大幅提高防御",
    type: "defense",
    mpCost: 10,
    cooldown: 2,
    minEvolution: 0,
    defenseBoost: 20,
  },
  primalFury: {
    name: "原始怒火",
    description: "释放原始的力量进行毁灭性攻击",
    type: "attack",
    mpCost: 35,
    cooldown: 3,
    minEvolution: 2,
    baseDamage: 60,
  },
};

/**
 * 人兽族技能
 */
export const HYBRID_SKILLS: Record<string, RaceSkillConfig> = {
  combo: {
    name: "连击",
    description: "进行快速的连续攻击",
    type: "attack",
    mpCost: 18,
    cooldown: 1,
    minEvolution: 0,
    baseDamage: 35,
  },
  counterAttack: {
    name: "反击",
    description: "预判敌人的攻击并进行反击",
    type: "special",
    mpCost: 22,
    cooldown: 2,
    minEvolution: 1,
    baseDamage: 28,
  },
  balancedDefense: {
    name: "均衡防御",
    description: "在攻防之间取得平衡",
    type: "defense",
    mpCost: 12,
    cooldown: 2,
    minEvolution: 0,
    defenseBoost: 17,
  },
  harmonizedStrike: {
    name: "和谐一击",
    description: "将身心合一，释放最强一击",
    type: "attack",
    mpCost: 38,
    cooldown: 3,
    minEvolution: 2,
    baseDamage: 55,
  },
};

/**
 * 获取种族的所有技能
 */
export function getRaceSkills(race: "human" | "beast" | "hybrid"): Record<string, RaceSkillConfig> {
  switch (race) {
    case "human":
      return HUMAN_SKILLS;
    case "beast":
      return BEAST_SKILLS;
    case "hybrid":
      return HYBRID_SKILLS;
    default:
      return HUMAN_SKILLS;
  }
}

/**
 * 获取特定进化阶段可用的技能
 */
export function getAvailableSkillsForEvolution(
  race: "human" | "beast" | "hybrid",
  evolution: number
): Record<string, RaceSkillConfig> {
  const allSkills = getRaceSkills(race);
  const available: Record<string, RaceSkillConfig> = {};

  for (const [key, skill] of Object.entries(allSkills)) {
    if (skill.minEvolution <= evolution) {
      available[key] = skill;
    }
  }

  return available;
}
