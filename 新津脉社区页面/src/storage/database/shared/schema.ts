import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

export const galleryImages = pgTable(
  "gallery_images",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    imageKey: text("image_key").notNull(),
    prompt: text("prompt").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    views: integer("views").default(0).notNull(),
    downloads: integer("downloads").default(0).notNull(),
    type: varchar("type", { length: 20 }).notNull(), // 'generated' or 'uploaded'
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    createdAtIndex: index("gallery_images_created_at_idx").on(table.createdAt),
    viewsIndex: index("gallery_images_views_idx").on(table.views),
    downloadsIndex: index("gallery_images_downloads_idx").on(table.downloads),
  })
);

// Use createSchemaFactory to configure date coercion
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Zod schemas for validation
export const insertGalleryImageSchema = createCoercedInsertSchema(galleryImages).pick({
  imageKey: true,
  prompt: true,
  width: true,
  height: true,
  type: true,
  views: true,
  downloads: true,
});

export const updateGalleryImageSchema = createCoercedInsertSchema(galleryImages)
  .pick({
    views: true,
    downloads: true,
  })
  .partial();

// TypeScript types
export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type UpdateGalleryImage = z.infer<typeof updateGalleryImageSchema>;
