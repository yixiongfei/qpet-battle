import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import {
  getPetEvolutionStage,
  canPetEvolve,
  evolvePet,
  levelUpPet,
  getExpRequiredForLevel,
  getNextEvolutionLevel,
} from './evolutionDb';

export const evolutionRouter = router({
  /**
   * 获取宠物的进化阶段
   */
  getEvolutionStage: publicProcedure
    .input(z.object({ petId: z.number() }))
    .query(async ({ input }) => {
      try {
        const stage = await getPetEvolutionStage(input.petId);
        return {
          success: true,
          stage,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to get evolution stage',
        };
      }
    }),

  /**
   * 检查宠物是否可以进化
   */
  checkCanEvolve: publicProcedure
    .input(z.object({ petId: z.number() }))
    .query(async ({ input }) => {
      try {
        const canEvolve = await canPetEvolve(input.petId);
        return {
          success: true,
          canEvolve,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to check evolution',
        };
      }
    }),

  /**
   * 执行宠物进化
   */
  evolvePet: publicProcedure
    .input(z.object({ petId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await evolvePet(input.petId);
        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Evolution failed',
        };
      }
    }),

  /**
   * 升级宠物
   */
  levelUpPet: publicProcedure
    .input(z.object({ petId: z.number(), expGain: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await levelUpPet(input.petId, input.expGain);
        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Level up failed',
        };
      }
    }),

  /**
   * 获取升级所需的经验值
   */
  getExpRequiredForLevel: publicProcedure
    .input(z.object({ level: z.number() }))
    .query(({ input }) => {
      const expRequired = getExpRequiredForLevel(input.level);
      return {
        success: true,
        expRequired,
      };
    }),

  /**
   * 获取下一个进化等级
   */
  getNextEvolutionLevel: publicProcedure
    .input(z.object({ currentLevel: z.number() }))
    .query(({ input }) => {
      const nextLevel = getNextEvolutionLevel(input.currentLevel);
      return {
        success: true,
        nextLevel,
      };
    }),
});
