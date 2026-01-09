import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { pets } from '../drizzle/schema';
import { calculatePetStats, EVOLUTION_LEVELS } from '../shared/raceSystem';

/**
 * 获取宠物的进化阶段
 */
export async function getPetEvolutionStage(petId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const pet = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);
  if (pet.length === 0) {
    throw new Error('Pet not found');
  }

  const level = pet[0].level;
  return EVOLUTION_LEVELS.filter((evoLevel) => level >= evoLevel).length;
}

/**
 * 检查宠物是否可以进化
 */
export async function canPetEvolve(petId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const pet = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);
  if (pet.length === 0) {
    throw new Error('Pet not found');
  }

  const currentEvolution = pet[0].evolution;
  const newEvolution = EVOLUTION_LEVELS.filter((evoLevel) => pet[0].level >= evoLevel).length;

  return newEvolution > currentEvolution;
}

/**
 * 执行宠物进化
 */
export async function evolvePet(petId: number): Promise<{ success: boolean; message: string; pet?: any }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const petResult = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);
    if (petResult.length === 0) {
      return { success: false, message: 'Pet not found' };
    }

    const pet = petResult[0];
    const newEvolution = EVOLUTION_LEVELS.filter((evoLevel) => pet.level >= evoLevel).length;

    if (newEvolution <= pet.evolution) {
      return { success: false, message: 'Pet cannot evolve at this level' };
    }

    // 计算进化后的属性
    const newStats = calculatePetStats(pet.race, pet.level);

    // 更新宠物信息
    await db
      .update(pets)
      .set({
        evolution: newEvolution,
        maxHp: newStats.maxHp,
        maxMp: newStats.maxMp,
        hp: newStats.hp,
        mp: newStats.mp,
        strength: newStats.strength,
        agility: newStats.agility,
        updatedAt: new Date(),
      })
      .where(eq(pets.id, petId));

    // 获取更新后的宠物信息
    const updatedPet = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);

    return {
      success: true,
      message: `宠物进化成功！现在是第 ${newEvolution} 阶段`,
      pet: updatedPet[0],
    };
  } catch (error) {
    console.error('Evolution error:', error);
    return { success: false, message: 'Evolution failed' };
  }
}

/**
 * 升级宠物
 */
export async function levelUpPet(petId: number, expGain: number): Promise<{ success: boolean; message: string; pet?: any; evolved?: boolean }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const petResult = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);
    if (petResult.length === 0) {
      return { success: false, message: 'Pet not found' };
    }

    const pet = petResult[0];
    let newLevel = pet.level;
    let newExp = pet.exp + expGain;

    // 检查是否升级
    while (newExp >= pet.maxExp) {
      newExp -= pet.maxExp;
      newLevel += 1;
    }

    // 计算新属性
    const newStats = calculatePetStats(pet.race, newLevel);

    // 检查是否进化
    const oldEvolution = pet.evolution;
    const newEvolution = EVOLUTION_LEVELS.filter((evoLevel) => newLevel >= evoLevel).length;
    const hasEvolved = newEvolution > oldEvolution;

    // 更新宠物信息
    await db
      .update(pets)
      .set({
        level: newLevel,
        exp: newExp,
        maxHp: newStats.maxHp,
        maxMp: newStats.maxMp,
        hp: newStats.hp,
        mp: newStats.mp,
        strength: newStats.strength,
        agility: newStats.agility,
        evolution: newEvolution,
        updatedAt: new Date(),
      })
      .where(eq(pets.id, petId));

    // 获取更新后的宠物信息
    const updatedPet = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);

    let message = '';
    if (newLevel > pet.level) {
      message = `宠物升级到第 ${newLevel} 级！`;
      if (hasEvolved) {
        message += ` 宠物进化成功！现在是第 ${newEvolution} 阶段`;
      }
    }

    return {
      success: true,
      message,
      pet: updatedPet[0],
      evolved: hasEvolved,
    };
  } catch (error) {
    console.error('Level up error:', error);
    return { success: false, message: 'Level up failed' };
  }
}

/**
 * 获取宠物升级所需的经验值
 */
export function getExpRequiredForLevel(level: number): number {
  // 每级需要的经验值 = 100 + (level - 1) * 50
  return 100 + (level - 1) * 50;
}

/**
 * 获取下一个进化等级
 */
export function getNextEvolutionLevel(currentLevel: number): number | null {
  const nextEvo = EVOLUTION_LEVELS.find((evoLevel) => evoLevel > currentLevel);
  return nextEvo || null;
}
