import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("lobby system", () => {
  it("should update player status", async () => {
    const { ctx } = createAuthContext(100);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lobby.updateStatus({
      status: "idle",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("updated");
  });

  it("should get online players list", async () => {
    const { ctx } = createAuthContext(101);
    const caller = appRouter.createCaller(ctx);

    // 先更新状态为在线
    await caller.lobby.updateStatus({ status: "idle" });

    const result = await caller.lobby.getOnlinePlayersList({
      limit: 20,
    });

    expect(result.success).toBe(true);
    expect(Array.isArray(result.players)).toBe(true);
  });

  it("should send battle invite", async () => {
    const { ctx: ctx1 } = createAuthContext(102);
    const { ctx: ctx2 } = createAuthContext(103);

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // 两个玩家都上线
    await caller1.lobby.updateStatus({ status: "idle" });
    await caller2.lobby.updateStatus({ status: "idle" });

    // 玩家1邀请玩家2
    const result = await caller1.lobby.sendBattleInvite({
      inviteeId: 103,
    });

    expect(result.success).toBe(true);
    expect(result.inviteId).toBeDefined();
    expect(result.expiresAt).toBeDefined();
  });

  it("should get pending invites", async () => {
    const { ctx: ctx1 } = createAuthContext(104);
    const { ctx: ctx2 } = createAuthContext(105);

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // 两个玩家都上线
    await caller1.lobby.updateStatus({ status: "idle" });
    await caller2.lobby.updateStatus({ status: "idle" });

    // 玩家1邀请玩家2
    const inviteResult = await caller1.lobby.sendBattleInvite({
      inviteeId: 105,
    });

    if (!inviteResult.success) {
      throw new Error("Failed to send invite");
    }

    // 玩家2获取待处理邀请
    const result = await caller2.lobby.getPendingInvites();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.invites)).toBe(true);
  });

  it("should accept battle invite", async () => {
    const { ctx: ctx1 } = createAuthContext(106);
    const { ctx: ctx2 } = createAuthContext(107);

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // 两个玩家都上线
    await caller1.lobby.updateStatus({ status: "idle" });
    await caller2.lobby.updateStatus({ status: "idle" });

    // 玩家1邀请玩家2
    const inviteResult = await caller1.lobby.sendBattleInvite({
      inviteeId: 107,
    });

    if (!inviteResult.success || !inviteResult.inviteId) {
      throw new Error("Failed to send invite");
    }

    // 玩家2接受邀请
    const result = await caller2.lobby.acceptInvite({
      inviteId: parseInt(inviteResult.inviteId),
      battleId: `battle-${Date.now()}`,
    });

    expect(result.success).toBe(true);
    expect(result.battleId).toBeDefined();
  });

  it("should decline battle invite", async () => {
    const { ctx: ctx1 } = createAuthContext(108);
    const { ctx: ctx2 } = createAuthContext(109);

    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // 两个玩家都上线
    await caller1.lobby.updateStatus({ status: "idle" });
    await caller2.lobby.updateStatus({ status: "idle" });

    // 玩家1邀请玩家2
    const inviteResult = await caller1.lobby.sendBattleInvite({
      inviteeId: 109,
    });

    if (!inviteResult.success || !inviteResult.inviteId) {
      throw new Error("Failed to send invite");
    }

    // 玩家2拒绝邀请
    const result = await caller2.lobby.declineInvite({
      inviteId: parseInt(inviteResult.inviteId),
    });

    expect(result.success).toBe(true);
  });

  it("should get player pet info", async () => {
    const { ctx } = createAuthContext(110);
    const caller = appRouter.createCaller(ctx);

    // 先创建一个宠物
    const petResult = await caller.pet.getPet();
    if (!petResult || !petResult.id) {
      throw new Error("Failed to create pet");
    }

    // 获取玩家宠物信息
    const result = await caller.lobby.getPlayerPetInfo({
      userId: 110,
    });

    expect(result.success).toBe(true);
    expect(result.petInfo).toBeDefined();
    expect(result.petInfo?.petName).toBeDefined();
    expect(result.petInfo?.petLevel).toBeDefined();
  });

  it("should handle offline status", async () => {
    const { ctx } = createAuthContext(111);
    const caller = appRouter.createCaller(ctx);

    // 更新状态为离线
    const result = await caller.lobby.updateStatus({
      status: "offline",
    });

    expect(result.success).toBe(true);
  });
});
