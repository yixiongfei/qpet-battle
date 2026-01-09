import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getUserPet,
  createUserPet,
  updatePet,
  getAllSkills,
  initializeSkills,
  getPetSkills,
  learnSkill,
  getPlayerStats,
  createPlayerStats,
  updatePlayerStats,
  getOnlinePlayerCount,
  updatePlayerOnlineStatus,
  getRandomOpponent,
} from "./petDb";

export const petRouter = router({
  /**
   * 获取或创建玩家的宠物
   */
  getPet: protectedProcedure.query(async ({ ctx }) => {
    let pet = await getUserPet(ctx.user.id);
    if (!pet) {
      pet = await createUserPet(ctx.user.id, "Q宠大侠");
    }
    return pet;
  }),

  /**
   * 更新宠物信息
   */
  updatePet: protectedProcedure
    .input(z.object({
      petId: z.number(),
      exp: z.number().optional(),
      hp: z.number().optional(),
      level: z.number().optional(),
      evolution: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      return await updatePet(input.petId, {
        exp: input.exp,
        hp: input.hp,
        level: input.level,
        evolution: input.evolution,
      });
    }),

  /**
   * 获取所有技能
   */
  getSkills: protectedProcedure.query(async () => {
    await initializeSkills();
    return await getAllSkills();
  }),

  /**
   * 获取宠物已学习的技能
   */
  getPetSkills: protectedProcedure
    .input(z.object({ petId: z.number() }))
    .query(async ({ input }) => {
      return await getPetSkills(input.petId);
    }),

  /**
   * 学习技能
   */
  learnSkill: protectedProcedure
    .input(z.object({
      petId: z.number(),
      skillId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const success = await learnSkill(input.petId, input.skillId);
      return { success };
    }),

  /**
   * 获取玩家统计
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    let stats = await getPlayerStats(ctx.user.id);
    if (!stats) {
      stats = await createPlayerStats(ctx.user.id);
    }
    return stats;
  }),

  /**
   * 更新玩家统计
   */
  updateStats: protectedProcedure
    .input(z.object({
      totalBattles: z.number().optional(),
      totalWins: z.number().optional(),
      currentWinStreak: z.number().optional(),
      maxWinStreak: z.number().optional(),
      totalGoldEarned: z.number().optional(),
      totalExpEarned: z.number().optional(),
      totalPotionsUsed: z.number().optional(),
      weaponsCollected: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await updatePlayerStats(ctx.user.id, input);
    }),

  /**
   * 获取在线玩家数量
   */
  getOnlinePlayerCount: protectedProcedure.query(async () => {
    return await getOnlinePlayerCount();
  }),

  /**
   * 更新玩家在线状态
   */
  updateOnlineStatus: protectedProcedure
    .input(z.object({
      petId: z.number(),
      level: z.number(),
      status: z.string().default("idle"),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await updatePlayerOnlineStatus(
        ctx.user.id,
        input.petId,
        input.level,
        input.status
      );
      return result && result.length > 0 ? result[0] : null;
    }),

  /**
   * 获取随机对手
   */
  getRandomOpponent: protectedProcedure
    .input(z.object({ currentLevel: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getRandomOpponent(ctx.user.id, input.currentLevel);
    }),

  /**
   * 开始匹配对战
   */
  startMatching: protectedProcedure
    .input(z.object({
      petId: z.number(),
      level: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 更新玩家状态为搜索中
      await updatePlayerOnlineStatus(ctx.user.id, input.petId, input.level, "searching");

      // 尝试找到对手
      const opponent = await getRandomOpponent(ctx.user.id, input.level);

      if (opponent) {
        // 找到对手，更新双方状态为对战中
        await updatePlayerOnlineStatus(ctx.user.id, input.petId, input.level, "battling");
        return {
          success: true,
          opponent,
          matchId: `${ctx.user.id}-${opponent.userId}-${Date.now()}`,
        };
      } else {
        // 没有找到对手，保持搜索状态
        return {
          success: false,
          opponent: null,
          message: "暂无对手，请稍后再试",
        };
      }
    }),

  /**
   * 结束对战
   */
  endBattle: protectedProcedure
    .input(z.object({
      petId: z.number(),
      level: z.number(),
      isWin: z.boolean(),
      goldEarned: z.number().default(0),
      expEarned: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      // 更新玩家状态回到空闲
      await updatePlayerOnlineStatus(ctx.user.id, input.petId, input.level, "idle");

      // 更新玩家统计
      let stats = await getPlayerStats(ctx.user.id);
      if (!stats) {
        stats = await createPlayerStats(ctx.user.id);
      }
      
      if (stats) {
        const updates: any = {
          totalBattles: (stats.totalBattles || 0) + 1,
          totalGoldEarned: (stats.totalGoldEarned || 0) + input.goldEarned,
          totalExpEarned: (stats.totalExpEarned || 0) + input.expEarned,
        };

        if (input.isWin) {
          updates.totalWins = (stats.totalWins || 0) + 1;
          updates.currentWinStreak = (stats.currentWinStreak || 0) + 1;
          updates.maxWinStreak = Math.max(
            updates.currentWinStreak,
            stats.maxWinStreak || 0
          );
        } else {
          updates.currentWinStreak = 0;
        }

        await updatePlayerStats(ctx.user.id, updates);
      }

      return { success: true };
    }),
});
