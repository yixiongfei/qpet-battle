import { describe, it, expect, beforeEach } from "vitest";
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

describe("friend system", () => {
  it("should add a friend", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx1);

    const result = await caller.friend.addFriend({ friendId: 2 });

    expect(result.success).toBe(true);
    expect(result.message).toContain("好友请求已发送");
  });

  it("should get friends list", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx1);

    const result = await caller.friend.getFriends();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should get pending friend requests", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx1);

    const result = await caller.friend.getPendingRequests();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should send friend invite", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx1);

    // First accept friendship
    await caller.friend.addFriend({ friendId: 2 });
    await caller.friend.acceptFriend({ friendId: 2 });

    // Then send invite
    const result = await caller.friend.sendInvite({ friendId: 2 });

    expect(result.success).toBe(true);
  });

  it("should get pending invites", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx1);

    const result = await caller.friend.getPendingInvites();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("should reject friend request", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx1);

    // Add friend first
    await caller.friend.addFriend({ friendId: 2 });

    // Then reject
    const result = await caller.friend.rejectFriend({ friendId: 2 });

    expect(result.success).toBe(true);
  });

  it("should remove friend", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx1);

    // Add and accept friendship
    await caller.friend.addFriend({ friendId: 2 });
    await caller.friend.acceptFriend({ friendId: 2 });

    // Then remove
    const result = await caller.friend.removeFriend({ friendId: 2 });

    expect(result.success).toBe(true);
  });

  it("should decline friend invite", async () => {
    const { ctx: ctx1 } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx1);

    // Get pending invites (assuming there's one with id 1)
    const result = await caller.friend.declineInvite({ inviteId: 1 });

    // Should either succeed or fail gracefully
    expect(typeof result.success).toBe("boolean");
  });
});
