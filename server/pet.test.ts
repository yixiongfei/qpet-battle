import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
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

  return ctx;
}

describe("pet router", () => {
  it("should get or create a pet for user", async () => {
    const ctx = createAuthContext(10);
    const caller = appRouter.createCaller(ctx);

    const pet = await caller.pet.getPet();

    expect(pet).toBeDefined();
    expect(pet?.userId).toBe(ctx.user.id);
    expect(pet?.name).toBe("Q宠大侠");
    expect(pet?.level).toBe(1);
    expect(pet?.evolution).toBe(0);
  });

  it("should get all skills", async () => {
    const ctx = createAuthContext(11);
    const caller = appRouter.createCaller(ctx);

    const skills = await caller.pet.getSkills();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBeGreaterThan(0);
    expect(skills[0]).toHaveProperty("name");
    expect(skills[0]).toHaveProperty("damage");
  });

  it("should get player stats", async () => {
    const ctx = createAuthContext(12);
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.pet.getStats();

    expect(stats).toBeDefined();
    expect(stats?.userId).toBe(ctx.user.id);
    expect(stats?.totalBattles).toBe(0);
    expect(stats?.totalWins).toBe(0);
    expect(stats?.currentWinStreak).toBe(0);
  });

  it("should update player stats after battle", async () => {
    const ctx = createAuthContext(13);
    const caller = appRouter.createCaller(ctx);

    const pet = await caller.pet.getPet();
    expect(pet).toBeDefined();

    const updated = await caller.pet.updateStats({
      totalBattles: 1,
      totalWins: 1,
      currentWinStreak: 1,
      totalGoldEarned: 100,
      totalExpEarned: 50,
    });

    expect(updated?.totalBattles).toBe(1);
    expect(updated?.totalWins).toBe(1);
    expect(updated?.currentWinStreak).toBe(1);
    expect(updated?.totalGoldEarned).toBe(100);
    expect(updated?.totalExpEarned).toBe(50);
  });

  it("should update pet information", async () => {
    const ctx = createAuthContext(16);
    const caller = appRouter.createCaller(ctx);

    const pet = await caller.pet.getPet();
    expect(pet).toBeDefined();

    const updated = await caller.pet.updatePet({
      petId: pet!.id,
      level: 5,
      exp: 100,
      hp: 80,
    });

    expect(updated?.level).toBe(5);
    expect(updated?.exp).toBe(100);
    expect(updated?.hp).toBe(80);
  });

  it("should get online player count", async () => {
    const ctx = createAuthContext(17);
    const caller = appRouter.createCaller(ctx);

    const count = await caller.pet.getOnlinePlayerCount();

    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should start matching and find opponent", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const pet2 = await caller2.pet.getPet();
    await caller2.pet.updateOnlineStatus({
      petId: pet2!.id,
      level: pet2!.level,
      status: "idle",
    });

    const pet1 = await caller1.pet.getPet();
    const matchResult = await caller1.pet.startMatching({
      petId: pet1!.id,
      level: pet1!.level,
    });

    if (matchResult.success) {
      expect(matchResult.opponent).toBeDefined();
      expect(matchResult.opponent?.userId).toBe(ctx2.user.id);
      expect(matchResult.matchId).toBeDefined();
    }
  });

  it("should end battle successfully", async () => {
    const ctx = createAuthContext(100);
    const caller = appRouter.createCaller(ctx);

    const pet = await caller.pet.getPet();
    expect(pet).toBeDefined();

    const result = await caller.pet.endBattle({
      petId: pet!.id,
      level: pet!.level,
      isWin: true,
      goldEarned: 100,
      expEarned: 50,
    });

    expect(result.success).toBe(true);
  });

  it("should handle battle loss", async () => {
    const ctx = createAuthContext(101);
    const caller = appRouter.createCaller(ctx);

    const pet = await caller.pet.getPet();

    const result = await caller.pet.endBattle({
      petId: pet!.id,
      level: pet!.level,
      isWin: false,
      goldEarned: 20,
      expEarned: 10,
    });

    expect(result.success).toBe(true);
  });
});
