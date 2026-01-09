import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  addFriend,
  acceptFriend,
  rejectFriend,
  removeFriend,
  getFriends,
  getPendingFriendRequests,
  sendFriendInvite,
  acceptFriendInvite,
  declineFriendInvite,
  getPendingInvites,
  isFriend,
} from "./friendDb";

/**
 * 好友系统路由
 */
export const friendRouter = router({
  /**
   * 添加好友
   */
  addFriend: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await addFriend(ctx.user.id, input.friendId);
        return { success: true, message: "好友请求已发送" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "添加好友失败",
        };
      }
    }),

  /**
   * 接受好友请求
   */
  acceptFriend: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await acceptFriend(ctx.user.id, input.friendId);
        return { success: true, message: "已接受好友请求" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "接受好友请求失败",
        };
      }
    }),

  /**
   * 拒绝好友请求
   */
  rejectFriend: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await rejectFriend(ctx.user.id, input.friendId);
        return { success: true, message: "已拒绝好友请求" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "拒绝好友请求失败",
        };
      }
    }),

  /**
   * 删除好友
   */
  removeFriend: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await removeFriend(ctx.user.id, input.friendId);
        return { success: true, message: "已删除好友" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "删除好友失败",
        };
      }
    }),

  /**
   * 获取好友列表
   */
  getFriends: protectedProcedure.query(async ({ ctx }) => {
    try {
      const friends = await getFriends(ctx.user.id);
      return { success: true, data: friends };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取好友列表失败",
        data: [],
      };
    }
  }),

  /**
   * 获取待处理的好友请求
   */
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    try {
      const requests = await getPendingFriendRequests(ctx.user.id);
      return { success: true, data: requests };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取好友请求失败",
        data: [],
      };
    }
  }),

  /**
   * 发送好友邀请对战
   */
  sendInvite: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // 检查是否是好友
        const isFriendResult = await isFriend(ctx.user.id, input.friendId);
        if (!isFriendResult) {
          return { success: false, message: "只能邀请好友对战" };
        }

        // 邀请有效期为24小时
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await sendFriendInvite(ctx.user.id, input.friendId, expiresAt);

        return { success: true, message: "邀请已发送" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "发送邀请失败",
        };
      }
    }),

  /**
   * 接受好友邀请
   */
  acceptInvite: protectedProcedure
    .input(z.object({ inviteId: z.number(), matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await acceptFriendInvite(input.inviteId, input.matchId);
        return { success: true, message: "已接受邀请" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "接受邀请失败",
        };
      }
    }),

  /**
   * 拒绝好友邀请
   */
  declineInvite: protectedProcedure
    .input(z.object({ inviteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await declineFriendInvite(input.inviteId);
        return { success: true, message: "已拒绝邀请" };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "拒绝邀请失败",
        };
      }
    }),

  /**
   * 获取待处理的邀请
   */
  getPendingInvites: protectedProcedure.query(async ({ ctx }) => {
    try {
      const invites = await getPendingInvites(ctx.user.id);
      return { success: true, data: invites };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "获取邀请失败",
        data: [],
      };
    }
  }),
});
