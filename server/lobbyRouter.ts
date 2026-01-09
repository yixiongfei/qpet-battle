import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  updatePlayerStatus,
  getOnlinePlayersList,
  sendBattleInvite,
  getPendingBattleInvites,
  acceptBattleInvite,
  declineBattleInvite,
  getPlayerPetInfo,
} from "./lobbyDb";

export const lobbyRouter = router({
  /**
   * 获取在线玩家列表
   */
  getOnlinePlayersList: protectedProcedure
    .input(
      z.object({
        limit: z.number().max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const players = await getOnlinePlayersList(ctx.user.id, input.limit);
        return {
          success: true,
          players,
        };
      } catch (error) {
        console.error("Failed to get online players:", error);
        return {
          success: false,
          players: [],
          message: "Failed to get online players",
        };
      }
    }),

  /**
   * 更新玩家在线状态
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(["idle", "matching", "inBattle", "offline"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await updatePlayerStatus(ctx.user.id, input.status);
        return {
          success: true,
          message: "Status updated successfully",
        };
      } catch (error) {
        console.error("Failed to update status:", error);
        return {
          success: false,
          message: "Failed to update status",
        };
      }
    }),

  /**
   * 发送对战邀请
   */
  sendBattleInvite: protectedProcedure
    .input(
      z.object({
        inviteeId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 邀请60秒后过期
        const expiresAt = new Date(Date.now() + 60 * 1000);

        const inviteId = await sendBattleInvite(
          ctx.user.id,
          input.inviteeId,
          expiresAt
        );

        return {
          success: true,
          inviteId,
          message: "Battle invite sent successfully",
          expiresAt,
        };
      } catch (error) {
        console.error("Failed to send battle invite:", error);
        return {
          success: false,
          message: "Failed to send battle invite",
        };
      }
    }),

  /**
   * 获取待处理的对战邀请
   */
  getPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    try {
      const invites = await getPendingBattleInvites(ctx.user.id);
      return {
        success: true,
        invites,
      };
    } catch (error) {
      console.error("Failed to get pending invites:", error);
      return {
        success: false,
        invites: [],
        message: "Failed to get pending invites",
      };
    }
  }),

  /**
   * 接受对战邀请
   */
  acceptInvite: protectedProcedure
    .input(
      z.object({
        inviteId: z.number(),
        battleId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await acceptBattleInvite(input.inviteId, input.battleId);
        return {
          success: true,
          message: "Battle invite accepted",
          battleId: input.battleId,
        };
      } catch (error) {
        console.error("Failed to accept invite:", error);
        return {
          success: false,
          message: "Failed to accept invite",
        };
      }
    }),

  /**
   * 拒绝对战邀请
   */
  declineInvite: protectedProcedure
    .input(
      z.object({
        inviteId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await declineBattleInvite(input.inviteId);
        return {
          success: true,
          message: "Battle invite declined",
        };
      } catch (error) {
        console.error("Failed to decline invite:", error);
        return {
          success: false,
          message: "Failed to decline invite",
        };
      }
    }),

  /**
   * 获取玩家宠物信息
   */
  getPlayerPetInfo: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const petInfo = await getPlayerPetInfo(input.userId);
        if (!petInfo) {
          return {
            success: false,
            message: "Player pet info not found",
          };
        }
        return {
          success: true,
          petInfo,
        };
      } catch (error) {
        console.error("Failed to get player pet info:", error);
        return {
          success: false,
          message: "Failed to get player pet info",
        };
      }
    }),
});
