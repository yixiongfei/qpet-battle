import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  renamePet,
  uploadPetImage,
  getPetInfo,
  increasePetMp,
  restorePetMp,
  consumePetMp,
} from "./petCustomization";

/**
 * 宠物自定义路由
 */
export const petCustomizationRouter = router({
  /**
   * 修改宠物名字
   */
  renamePet: protectedProcedure
    .input(z.object({ petId: z.number(), newName: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await renamePet(input.petId, input.newName);
        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "修改名字失败",
        };
      }
    }),

  /**
   * 上传宠物图片
   */
  uploadImage: protectedProcedure
    .input(
      z.object({
        petId: z.number(),
        imageData: z.string(), // base64编码的图片数据
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 将base64转换为Buffer
        const imageBuffer = Buffer.from(input.imageData, "base64");
        const result = await uploadPetImage(
          input.petId,
          imageBuffer,
          input.mimeType
        );
        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "上传图片失败",
        };
      }
    }),

  /**
   * 获取宠物信息
   */
  getPetInfo: protectedProcedure
    .input(z.object({ petId: z.number() }))
    .query(async ({ input }) => {
      try {
        const pet = await getPetInfo(input.petId);
        return { success: true, data: pet };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "获取宠物信息失败",
          data: null,
        };
      }
    }),

  /**
   * 升级时增加蓝量
   */
  increaseMp: protectedProcedure
    .input(z.object({ petId: z.number(), mpIncrease: z.number().optional() }))
    .mutation(async ({ input }) => {
      try {
        const result = await increasePetMp(
          input.petId,
          input.mpIncrease || 10
        );
        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "增加蓝量失败",
        };
      }
    }),

  /**
   * 战斗中恢复蓝量
   */
  restoreMp: protectedProcedure
    .input(z.object({ petId: z.number(), mpRestore: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await restorePetMp(input.petId, input.mpRestore);
        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "恢复蓝量失败",
        };
      }
    }),

  /**
   * 战斗中消耗蓝量
   */
  consumeMp: protectedProcedure
    .input(z.object({ petId: z.number(), mpCost: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await consumePetMp(input.petId, input.mpCost);
        return result;
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "蓝量不足",
        };
      }
    }),
});
