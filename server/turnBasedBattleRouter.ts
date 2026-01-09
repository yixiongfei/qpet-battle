import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  initializeBattle,
  getPetAvailableSkills,
  executeSkill,
  executeDefend,
  endRound,
  applyDamage,
  getAIAction,
  type BattleState,
} from "./turnBasedBattle";
import { getDb } from "./db";
import { pets } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// 存储活跃战斗状态（实际应用中应使用Redis）
const activeBattles = new Map<string, BattleState>();

/**
 * 生成战斗ID
 */
function generateBattleId(userId: number, opponentId: number): string {
  return `battle-${Math.min(userId, opponentId)}-${Math.max(userId, opponentId)}-${Date.now()}`;
}

/**
 * 回合制战斗路由
 */
export const turnBasedBattleRouter = router({
  /**
   * 初始化战斗
   */
  initBattle: protectedProcedure
    .input(
      z.object({
        playerPetId: z.number(),
        opponentPetId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const battleState = await initializeBattle(
          input.playerPetId,
          input.opponentPetId
        );
        const battleId = generateBattleId(ctx.user.id, 0);
        activeBattles.set(battleId, battleState);

        return {
          success: true,
          battleId,
          battleState,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "初始化战斗失败",
        };
      }
    }),

  /**
   * 获取可用技能
   */
  getAvailableSkills: protectedProcedure
    .input(z.object({ petId: z.number() }))
    .query(async ({ input }) => {
      try {
        const skills = await getPetAvailableSkills(input.petId);
        return {
          success: true,
          skills,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "获取技能失败",
          skills: [],
        };
      }
    }),

  /**
   * 执行玩家回合
   */
  playerAction: protectedProcedure
    .input(
      z.object({
        battleId: z.string(),
        actionType: z.enum(["skill", "defend"]),
        skillId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const battleState = activeBattles.get(input.battleId);
        if (!battleState) {
          return {
            success: false,
            message: "战斗不存在",
          };
        }

        if (battleState.isFinished) {
          return {
            success: false,
            message: "战斗已结束",
          };
        }

        let playerDamage = 0;
        let playerMessage = "";

        // 执行玩家动作
        if (input.actionType === "skill" && input.skillId) {
          const skillResult = await executeSkill(
            battleState,
            true,
            input.skillId
          );
          if (!skillResult.success) {
            return {
              success: false,
              message: skillResult.message,
            };
          }
          playerDamage = skillResult.damage;
          playerMessage = skillResult.message;
          applyDamage(battleState, false, playerDamage);
        } else if (input.actionType === "defend") {
          const defendResult = executeDefend(battleState, true);
          playerMessage = defendResult.message;
        }

        battleState.battleLog.push(`玩家: ${playerMessage}`);

        // 检查对手是否已被击败
        if (battleState.opponentPetHp <= 0) {
          battleState.isFinished = true;
          battleState.winner = 1;
          battleState.battleLog.push("战斗结束！您的宠物获胜！");
          return {
            success: true,
            battleState,
            isFinished: true,
          };
        }

        // AI执行回合
        const aiAction = await getAIAction(
          battleState,
          battleState.opponentPetId
        );
        let opponentDamage = 0;
        let opponentMessage = "";

        if (aiAction.actionType === "skill" && aiAction.skillId) {
          const skillResult = await executeSkill(
            battleState,
            false,
            aiAction.skillId
          );
          if (skillResult.success) {
            opponentDamage = skillResult.damage;
            opponentMessage = skillResult.message;
            applyDamage(battleState, true, opponentDamage);
          } else {
            opponentMessage = "对手防守";
            executeDefend(battleState, false);
          }
        } else {
          opponentMessage = "对手防守";
          executeDefend(battleState, false);
        }

        battleState.battleLog.push(`对手: ${opponentMessage}`);

        // 检查玩家是否已被击败
        if (battleState.playerPetHp <= 0) {
          battleState.isFinished = true;
          battleState.winner = 2;
          battleState.battleLog.push("战斗结束！您的宠物被击败了！");
          return {
            success: true,
            battleState,
            isFinished: true,
          };
        }

        // 回合结束处理
        endRound(battleState);

        return {
          success: true,
          battleState,
          isFinished: battleState.isFinished,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "执行动作失败",
        };
      }
    }),

  /**
   * 获取战斗状态
   */
  getBattleState: protectedProcedure
    .input(z.object({ battleId: z.string() }))
    .query(async ({ input }) => {
      const battleState = activeBattles.get(input.battleId);
      if (!battleState) {
        return {
          success: false,
          message: "战斗不存在",
        };
      }

      return {
        success: true,
        battleState,
      };
    }),

  /**
   * 结束战斗并保存结果
   */
  endBattle: protectedProcedure
    .input(
      z.object({
        battleId: z.string(),
        playerPetId: z.number(),
        opponentPetId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const battleState = activeBattles.get(input.battleId);
        if (!battleState) {
          return {
            success: false,
            message: "战斗不存在",
          };
        }

        const db = await getDb();
        if (!db) {
          return {
            success: false,
            message: "数据库连接失败",
          };
        }

        // 更新宠物血量
        await db
          .update(pets)
          .set({ hp: battleState.playerPetHp })
          .where(eq(pets.id, input.playerPetId));

        await db
          .update(pets)
          .set({ hp: battleState.opponentPetHp })
          .where(eq(pets.id, input.opponentPetId));

        // 清除战斗状态
        activeBattles.delete(input.battleId);

        return {
          success: true,
          winner: battleState.winner,
          message:
            battleState.winner === 1 ? "您赢得了战斗！" : "您输掉了战斗！",
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "结束战斗失败",
        };
      }
    }),

  /**
   * 放弃战斗
   */
  surrenderBattle: protectedProcedure
    .input(z.object({ battleId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const battleState = activeBattles.get(input.battleId);
        if (!battleState) {
          return {
            success: false,
            message: "战斗不存在",
          };
        }

        battleState.isFinished = true;
        battleState.winner = 2;
        battleState.battleLog.push("您已放弃战斗！");

        return {
          success: true,
          message: "已放弃战斗",
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "放弃战斗失败",
        };
      }
    }),
});
