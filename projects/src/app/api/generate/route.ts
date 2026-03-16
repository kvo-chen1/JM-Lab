import { NextRequest, NextResponse } from "next/server";
import { ImageGenerationClient, Config } from "coze-coding-dev-sdk";
import { storage } from "@/utils/storage";
import { imageManager } from "@/storage/database";

const config = new Config();
const client = new ImageGenerationClient(config);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, ratio = "9:16" } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Map ratio to size
    // Based on integration limits: Custom sizes must be within [2560x1440, 4096x4096].
    // This implies Width must be >= 2560.
    // To achieve vertical aspect ratios, we use the narrowest possible width (2560) and max height (4096).
    // 2560x4096 is approx 1:1.6 (close to 9:16's 1:1.77)
    
    let width = 2560;
    let height = 4096;
    let sizeParam = "2560x4096"; // Approx 9:16

    if (ratio === "3:4") {
        width = 3072;
        height = 4096;
        sizeParam = "3072x4096";
    } else if (ratio === "1:1") {
        width = 4096;
        height = 4096;
        sizeParam = "4096x4096";
    } else if (ratio === "16:9") {
        width = 4096;
        height = 2304;
        sizeParam = "4096x2304";
    } else if (ratio === "4:3") {
        width = 4096;
        height = 3072;
        sizeParam = "4096x3072";
    }

    // Enforce pixel art style
    const pixelArtSuffix = ", pixel art style, 16-bit, retro game aesthetic, sharp focus, high contrast, clean lines, detailed pixel art, masterpiece, best quality";
    const enhancedPrompt = prompt + pixelArtSuffix;

    const response = await client.generate({
      prompt: enhancedPrompt,
      size: sizeParam,
    });

    const helper = client.getResponseHelper(response);

    if (!helper.success) {
      return NextResponse.json({ error: helper.errorMessages.join(", ") }, { status: 500 });
    }

    const imageUrl = helper.imageUrls[0];
    
    // Upload to S3
    const key = await storage.uploadFromUrl({
        url: imageUrl,
        timeout: 60000
    });

    // Save to DB
    const newImage = await imageManager.createImage({
      imageKey: key,
      prompt,
      width,
      height,
      type: "generated",
    });
    
    const signedUrl = await storage.generatePresignedUrl({ key, expireTime: 2592000 });

    return NextResponse.json({ ...newImage, url: signedUrl });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
