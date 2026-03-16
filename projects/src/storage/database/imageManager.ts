import { eq, desc, asc, sql, and, like } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { galleryImages, insertGalleryImageSchema } from "./shared/schema";
import type { GalleryImage, InsertGalleryImage } from "./shared/schema";

export class ImageManager {
  async createImage(data: InsertGalleryImage): Promise<GalleryImage> {
    const db = await getDb();
    const validated = insertGalleryImageSchema.parse(data);
    const [image] = await db.insert(galleryImages).values(validated).returning();
    return image;
  }

  async getImages(options: {
    limit?: number;
    offset?: number;
    sortBy?: "views" | "downloads" | "created_at";
    sortOrder?: "asc" | "desc";
    period?: "day" | "week" | "month";
    search?: string;
  } = {}): Promise<GalleryImage[]> {
    const { limit = 50, offset = 0, sortBy = "created_at", sortOrder = "desc", period, search } = options;
    const db = await getDb();

    // Use conditions array to build where clause safely
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(like(galleryImages.prompt, `%${search}%`));
    }

    // Period filter
    if (period) {
      let dateFilter: Date;
      const now = new Date();
      if (period === "day") {
        dateFilter = new Date(now.setDate(now.getDate() - 1));
      } else if (period === "week") {
        dateFilter = new Date(now.setDate(now.getDate() - 7));
      } else {
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
      }
      conditions.push(sql`${galleryImages.createdAt} >= ${dateFilter}`);
    }

    let query = db.select().from(galleryImages).$dynamic();
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sort
    const orderFunc = sortOrder === "asc" ? asc : desc;
    
    if (sortBy === "views") {
      query = query.orderBy(orderFunc(galleryImages.views));
    } else if (sortBy === "downloads") {
      query = query.orderBy(orderFunc(galleryImages.downloads));
    } else {
      query = query.orderBy(orderFunc(galleryImages.createdAt));
    }

    return query.limit(limit).offset(offset);
  }

  async getImageById(id: string): Promise<GalleryImage | null> {
    const db = await getDb();
    const [image] = await db.select().from(galleryImages).where(eq(galleryImages.id, id));
    return image || null;
  }

  async incrementViews(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(galleryImages)
      .set({ views: sql`${galleryImages.views} + 1` })
      .where(eq(galleryImages.id, id));
  }

  async incrementDownloads(id: string): Promise<void> {
    const db = await getDb();
    await db
      .update(galleryImages)
      .set({ downloads: sql`${galleryImages.downloads} + 1` })
      .where(eq(galleryImages.id, id));
  }
}

export const imageManager = new ImageManager();
