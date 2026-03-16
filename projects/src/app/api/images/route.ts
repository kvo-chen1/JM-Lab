import { NextRequest, NextResponse } from "next/server";
import { imageManager } from "@/storage/database";
import { storage } from "@/utils/storage";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sortBy = searchParams.get("sortBy") as "views" | "downloads" | "created_at" | undefined;
  const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | undefined;
  const period = searchParams.get("period") as "day" | "week" | "month" | undefined;
  const search = searchParams.get("search") || undefined;
  
  const images = await imageManager.getImages({
    sortBy,
    sortOrder,
    period,
    search,
    limit: 50,
  });

  const imagesWithUrls = await Promise.all(
    images.map(async (img) => {
      let url = img.imageKey;
      // If it's a full URL (mock data), use it directly
      if (!url.startsWith("http")) {
          url = await storage.generatePresignedUrl({
            key: img.imageKey,
            expireTime: 2592000, // 30 days
          });
      }
      return { ...img, url };
    })
  );

  return NextResponse.json(imagesWithUrls);
}
