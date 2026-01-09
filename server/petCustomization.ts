import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { pets } from "../drizzle/schema";
import { storagePut } from "./storage";
import sharp from "sharp";
// sharp 已包含类型定义

/**
 * 修改宠物名字
 */
export async function renamePet(petId: number, newName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (!newName || newName.trim().length === 0) {
    throw new Error("宠物名字不能为空");
  }

  if (newName.length > 64) {
    throw new Error("宠物名字过长，最多64个字符");
  }

  await db
    .update(pets)
    .set({ name: newName.trim() })
    .where(eq(pets.id, petId));

  return { success: true, message: "宠物名字已修改" };
}

/**
 * 上传并保存宠物图片
 * @param petId 宠物ID
 * @param imageBuffer 图片二进制数据
 * @param mimeType 图片MIME类型
 */
export async function uploadPetImage(
  petId: number,
  imageBuffer: Buffer,
  mimeType: string
) {
  try {
    // 验证图片格式
    if (!["image/jpeg", "image/png"].includes(mimeType)) {
      throw new Error("只支持JPG和PNG格式的图片");
    }

    // 使用sharp裁剪图片到256x256
    const processedImage = await sharp(imageBuffer)
      .resize(256, 256, {
        fit: "cover",
        position: "center",
      })
      .toBuffer();

    // 上传到S3
    const fileKey = `pets/${petId}-${Date.now()}.${mimeType === "image/jpeg" ? "jpg" : "png"}`;
    const { url } = await storagePut(fileKey, processedImage, mimeType);

    // 更新数据库
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(pets)
      .set({ imageUrl: url })
      .where(eq(pets.id, petId));

    return { success: true, imageUrl: url, message: "图片上传成功" };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "图片上传失败"
    );
  }
}

/**
 * 获取宠物信息
 */
export async function getPetInfo(petId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(pets)
    .where(eq(pets.id, petId))
    .limit(1);

  if (result.length === 0) {
    throw new Error("宠物不存在");
  }

  return result[0];
}

/**
 * 升级时增加蓝量
 */
export async function increasePetMp(petId: number, mpIncrease: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pet = await getPetInfo(petId);
  const newMaxMp = pet.maxMp + mpIncrease;

  await db
    .update(pets)
    .set({ maxMp: newMaxMp, mp: newMaxMp })
    .where(eq(pets.id, petId));

  return { success: true, newMaxMp };
}

/**
 * 战斗中恢复蓝量
 */
export async function restorePetMp(petId: number, mpRestore: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pet = await getPetInfo(petId);
  const newMp = Math.min(pet.mp + mpRestore, pet.maxMp);

  await db
    .update(pets)
    .set({ mp: newMp })
    .where(eq(pets.id, petId));

  return { success: true, currentMp: newMp };
}

/**
 * 战斗中消耗蓝量
 */
export async function consumePetMp(petId: number, mpCost: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pet = await getPetInfo(petId);

  if (pet.mp < mpCost) {
    throw new Error("蓝量不足");
  }

  const newMp = pet.mp - mpCost;

  await db
    .update(pets)
    .set({ mp: newMp })
    .where(eq(pets.id, petId));

  return { success: true, currentMp: newMp };
}
