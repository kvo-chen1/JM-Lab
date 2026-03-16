import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/utils/storage";
import { imageManager } from "@/storage/database";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const widthStr = formData.get("width") as string;
    const heightStr = formData.get("height") as string;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName: file.name,
      contentType: file.type,
    });

    const newImage = await imageManager.createImage({
      imageKey: key,
      prompt: "Uploaded Image", // Default prompt for uploads
      width: parseInt(widthStr || "0"),
      height: parseInt(heightStr || "0"),
      type: "uploaded",
    });

    const signedUrl = await storage.generatePresignedUrl({ key, expireTime: 2592000 });

    return NextResponse.json({ ...newImage, url: signedUrl });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
