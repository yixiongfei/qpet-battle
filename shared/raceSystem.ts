/**
 * 宠物种族系统
 * 三个种族：人（Human）、兽（Beast）、人兽（Hybrid）
 */

export type PetRace = "human" | "beast" | "hybrid";

export const RACE_CONFIG: Record<PetRace, {
  name: string;
  description: string;
  hpBase: number;
  hpPerLevel: number;
  mpBase: number;
  mpPerLevel: number;
  strengthBase: number;
  agilityBase: number;
}> = {
  human: {
    name: "人族",
    description: "血量低，蓝量高，擅长魔法攻击",
    hpBase: 50,
    hpPerLevel: 8,
    mpBase: 100,
    mpPerLevel: 15,
    strengthBase: 8,
    agilityBase: 7,
  },
  beast: {
    name: "兽族",
    description: "血量高，蓝量低，擅长物理攻击",
    hpBase: 100,
    hpPerLevel: 20,
    mpBase: 50,
    mpPerLevel: 8,
    strengthBase: 12,
    agilityBase: 4,
  },
  hybrid: {
    name: "人兽族",
    description: "血量中等，蓝量中等，均衡发展",
    hpBase: 75,
    hpPerLevel: 14,
    mpBase: 75,
    mpPerLevel: 12,
    strengthBase: 10,
    agilityBase: 6,
  },
};

/**
 * 计算宠物的最大血量
 */
export function calculateMaxHp(race: PetRace, level: number): number {
  const config = RACE_CONFIG[race];
  return config.hpBase + config.hpPerLevel * (level - 1);
}

/**
 * 计算宠物的最大蓝量
 */
export function calculateMaxMp(race: PetRace, level: number): number {
  const config = RACE_CONFIG[race];
  return config.mpBase + config.mpPerLevel * (level - 1);
}

/**
 * 计算宠物的力量属性
 */
export function calculateStrength(race: PetRace, level: number): number {
  const config = RACE_CONFIG[race];
  return config.strengthBase + Math.floor((level - 1) * 0.5);
}

/**
 * 计算宠物的敏捷属性
 */
export function calculateAgility(race: PetRace, level: number): number {
  const config = RACE_CONFIG[race];
  return config.agilityBase + Math.floor((level - 1) * 0.3);
}

/**
 * 进化等级配置
 */
export const EVOLUTION_LEVELS = [10, 30, 50];

/**
 * 获取宠物的进化阶段
 */
export function getEvolutionStage(level: number): number {
  if (level >= 50) return 2;
  if (level >= 30) return 1;
  return 0;
}

/**
 * 检查宠物是否可以进化
 */
export function canEvolve(currentLevel: number, currentEvolution: number): boolean {
  const nextEvolutionLevel = EVOLUTION_LEVELS[currentEvolution];
  return currentLevel >= nextEvolutionLevel && currentEvolution < EVOLUTION_LEVELS.length;
}

/**
 * 获取下一个进化所需的等级
 */
export function getNextEvolutionLevel(currentEvolution: number): number | null {
  if (currentEvolution >= EVOLUTION_LEVELS.length) return null;
  return EVOLUTION_LEVELS[currentEvolution];
}

/**
 * 计算宠物的所有属性
 */
export function calculatePetStats(race: PetRace, level: number) {
  return {
    hp: calculateMaxHp(race, level),
    maxHp: calculateMaxHp(race, level),
    mp: calculateMaxMp(race, level),
    maxMp: calculateMaxMp(race, level),
    strength: calculateStrength(race, level),
    agility: calculateAgility(race, level),
  };
}

/**
 * 12个独特技能（每个种族4个）
 */
export interface SkillConfig {
  id: number;
  name: string;
  description: string;
  damage: number;
  mpCost: number;
  cooldown: number;
  mpRestore: number;
  requiredLevel: number;
  requiredEvolution: number;
  icon: string;
}

export const SKILLS_BY_RACE: Record<PetRace, SkillConfig[]> = {
  human: [
    {
      id: 1,
      name: "魔法箭",
      description: "射出魔法箭，造成伤害",
      damage: 30,
      mpCost: 20,
      cooldown: 0,
      mpRestore: 0,
      requiredLevel: 1,
      requiredEvolution: 0,
      icon: "🔮",
    },
    {
      id: 2,
      name: "冰冻术",
      description: "冻结敌人，造成伤害并降低其速度",
      damage: 40,
      mpCost: 30,
      cooldown: 1,
      mpRestore: 0,
      requiredLevel: 10,
      requiredEvolution: 1,
      icon: "❄️",
    },
    {
      id: 3,
      name: "魔法风暴",
      description: "释放魔法风暴，造成大量伤害",
      damage: 60,
      mpCost: 50,
      cooldown: 2,
      mpRestore: 0,
      requiredLevel: 30,
      requiredEvolution: 2,
      icon: "⛈️",
    },
    {
      id: 4,
      name: "魔法禁制",
      description: "禁止敌人使用魔法",
      damage: 20,
      mpCost: 40,
      cooldown: 3,
      mpRestore: 0,
      requiredLevel: 50,
      requiredEvolution: 3,
      icon: "🚫",
    },
  ],
  beast: [
    {
      id: 5,
      name: "野蛮冲撞",
      description: "蛮力冲撞，造成伤害",
      damage: 50,
      mpCost: 15,
      cooldown: 0,
      mpRestore: 0,
      requiredLevel: 1,
      requiredEvolution: 0,
      icon: "💥",
    },
    {
      id: 6,
      name: "猛烈斩击",
      description: "用力斩击，造成大量伤害",
      damage: 70,
      mpCost: 20,
      cooldown: 1,
      mpRestore: 0,
      requiredLevel: 10,
      requiredEvolution: 1,
      icon: "⚔️",
    },
    {
      id: 7,
      name: "狂暴状态",
      description: "进入狂暴状态，大幅提升攻击力",
      damage: 80,
      mpCost: 25,
      cooldown: 2,
      mpRestore: 0,
      requiredLevel: 30,
      requiredEvolution: 2,
      icon: "🔥",
    },
    {
      id: 8,
      name: "终极一击",
      description: "蓄力后的终极一击，造成巨大伤害",
      damage: 100,
      mpCost: 30,
      cooldown: 3,
      mpRestore: 0,
      requiredLevel: 50,
      requiredEvolution: 3,
      icon: "💫",
    },
  ],
  hybrid: [
    {
      id: 9,
      name: "平衡打击",
      description: "均衡的攻击，造成伤害",
      damage: 40,
      mpCost: 18,
      cooldown: 0,
      mpRestore: 0,
      requiredLevel: 1,
      requiredEvolution: 0,
      icon: "⚡",
    },
    {
      id: 10,
      name: "能量爆发",
      description: "释放能量，造成伤害并恢复蓝量",
      damage: 45,
      mpCost: 25,
      cooldown: 1,
      mpRestore: 15,
      requiredLevel: 10,
      requiredEvolution: 1,
      icon: "✨",
    },
    {
      id: 11,
      name: "混合技能",
      description: "结合物理和魔法的混合技能",
      damage: 65,
      mpCost: 35,
      cooldown: 2,
      mpRestore: 0,
      requiredLevel: 30,
      requiredEvolution: 2,
      icon: "🌟",
    },
    {
      id: 12,
      name: "完美融合",
      description: "完美融合物理和魔法力量",
      damage: 85,
      mpCost: 45,
      cooldown: 3,
      mpRestore: 20,
      requiredLevel: 50,
      requiredEvolution: 3,
      icon: "🎆",
    },
  ],
};
