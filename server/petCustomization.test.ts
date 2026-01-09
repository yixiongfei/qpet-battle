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

describe("pet customization", () => {
  it("should get pet info", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // 先创建一个宠物
    const petResult = await caller.pet.getPet();
    if (!petResult || !petResult.id) {
      throw new Error("Failed to create pet");
    }

    const petId = petResult.id;

    // 获取宠物信息
    const result = await caller.petCustomization.getPetInfo({ petId });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.id).toBe(petId);
    expect(result.data?.mp).toBeDefined();
    expect(result.data?.maxMp).toBeDefined();
  });

  it("should rename pet", async () => {
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    // 创建宠物
    const petResult = await caller.pet.getPet();
    if (!petResult || !petResult.id) {
      throw new Error("Failed to create pet");
    }

    const petId = petResult.id;
    const newName = "超级宠物";

    // 修改名字
    const result = await caller.petCustomization.renamePet({
      petId,
      newName,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("已修改");

    // 验证名字已修改
    const petInfo = await caller.petCustomization.getPetInfo({ petId });
    expect(petInfo.data?.name).toBe(newName);
  });

  it("should reject empty pet name", async () => {
    const { ctx } = createAuthContext(3);
    const caller = appRouter.createCaller(ctx);

    const petResult = await caller.pet.getPet();
    if (!petResult || !petResult.id) {
      throw new Error("Failed to create pet");
    }

    const petId = petResult.id;

    const result = await caller.petCustomization.renamePet({
      petId,
      newName: "",
    });

    expect(result.success).toBe(false);
  });

  it("should increase mp on level up", async () => {
    const { ctx } = createAuthContext(4);
    const caller = appRouter.createCaller(ctx);

    const petResult = await caller.pet.getPet();
    if (!petResult || !petResult.id) {
      throw new Error("Failed to create pet");
    }

    const petId = petResult.id;
    const originalMp = petResult.maxMp;

    // 增加蓝量
    const result = await caller.petCustomization.increaseMp({
      petId,
      mpIncrease: 20,
    });

    expect(result.success).toBe(true);
    expect(result.newMaxMp).toBe(originalMp + 20);
  });

  it("should restore mp during battle", async () => {
    const { ctx } = createAuthContext(5);
    const caller = appRouter.createCaller(ctx);

    const petResult = await caller.pet.getPet();
    if (!petResult || !petResult.id) {
      throw new Error("Failed to create pet");
    }

    const petId = petResult.id;

    // 恢复蓝量
    const result = await caller.petCustomization.restoreMp({
      petId,
      mpRestore: 25,
    });

    expect(result.success).toBe(true);
    expect(result.currentMp).toBeDefined();
  });

  it("should consume mp when using skill", async () => {
    const { ctx } = createAuthContext(6);
    const caller = appRouter.createCaller(ctx);

    const petResult = await caller.pet.getPet();
    if (!petResult || !petResult.id) {
      throw new Error("Failed to create pet");
    }

    const petId = petResult.id;

    // 消耗蓝量
    const result = await caller.petCustomization.consumeMp({
      petId,
      mpCost: 10,
    });

    expect(result.success).toBe(true);
    expect(result.currentMp).toBeDefined();
  });

  it("should reject consume mp when insufficient", async () => {
    const { ctx } = createAuthContext(7);
    const caller = appRouter.createCaller(ctx);

    const petResult = await caller.pet.getPet();
    if (!petResult || !petResult.id) {
      throw new Error("Failed to create pet");
    }

    const petId = petResult.id;
    const petInfo = await caller.petCustomization.getPetInfo({ petId });
    const maxMp = petInfo.data?.maxMp || 50;

    // 尝试消耗超过最大蓝量的蓝量
    const result = await caller.petCustomization.consumeMp({
      petId,
      mpCost: maxMp + 100,
    });

    expect(result.success).toBe(false);
  });
});
