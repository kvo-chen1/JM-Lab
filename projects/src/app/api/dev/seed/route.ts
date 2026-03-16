import { NextResponse } from "next/server";
import { imageManager } from "@/storage/database";

// Mock Data for Pixel Art Theme
const mockData = [
  {
    prompt: "Cyberpunk city street at night, neon lights, rain, pixel art style",
    width: 2560,
    height: 4096, // 9:16 approx
    imageKey: "https://placehold.co/576x1024/110022/00FFFF/png?text=Cyberpunk\nCity&font=roboto",
    type: "generated",
    views: 1250,
    downloads: 340,
  },
  {
    prompt: "Cozy cottage in autumn woods, warm light, pixel art, 16-bit",
    width: 3072,
    height: 4096, // 3:4
    imageKey: "https://placehold.co/768x1024/331100/FFCC00/png?text=Autumn\nCottage&font=roboto",
    type: "generated",
    views: 890,
    downloads: 120,
  },
  {
    prompt: "Retro space station interior, sci-fi console, pixel art",
    width: 4096,
    height: 2304, // 16:9
    imageKey: "https://placehold.co/1024x576/000033/00FF00/png?text=Space\nStation&font=roboto",
    type: "generated",
    views: 2100,
    downloads: 560,
  },
  {
    prompt: "Pixel art portrait of a warrior with blue hair, fantasy rpg style",
    width: 3072,
    height: 4096, // 3:4
    imageKey: "https://placehold.co/768x1024/000000/3366FF/png?text=Warrior\nPortrait&font=roboto",
    type: "generated",
    views: 450,
    downloads: 45,
  },
  {
    prompt: "Sunset over the ocean, reflection, dithering effect, pixel art",
    width: 4096,
    height: 4096, // 1:1
    imageKey: "https://placehold.co/1024x1024/FF3300/FFFF00/png?text=Sunset\nOcean&font=roboto",
    type: "generated",
    views: 3200,
    downloads: 890,
  },
  {
    prompt: "Magical forest with glowing mushrooms, purple and green theme, pixel art",
    width: 2560,
    height: 4096, // 9:16
    imageKey: "https://placehold.co/576x1024/220022/00FF00/png?text=Magic\nForest&font=roboto",
    type: "generated",
    views: 1500,
    downloads: 230,
  },
  {
    prompt: "Isometric room design, gamer setup, computers, pixel art",
    width: 4096,
    height: 4096, // 1:1
    imageKey: "https://placehold.co/1024x1024/1a1a1a/FF0055/png?text=Gamer\nRoom&font=roboto",
    type: "generated",
    views: 5600,
    downloads: 1200,
  },
  {
    prompt: "Dragon flying over mountains, retro game cutscene style",
    width: 4096,
    height: 2304, // 16:9
    imageKey: "https://placehold.co/1024x576/330000/FF0000/png?text=Dragon\nFly&font=roboto",
    type: "generated",
    views: 980,
    downloads: 150,
  },
  {
    prompt: "Pixel food, ramen bowl with steam, delicious, 32-bit",
    width: 4096,
    height: 4096, // 1:1
    imageKey: "https://placehold.co/1024x1024/FFFFFF/000000/png?text=Pixel\nRamen&font=roboto",
    type: "generated",
    views: 2300,
    downloads: 670,
  },
  {
    prompt: "Haunted castle silhouette against full moon, halloween theme, pixel art",
    width: 3072,
    height: 4096, // 3:4
    imageKey: "https://placehold.co/768x1024/000000/666666/png?text=Haunted\nCastle&font=roboto",
    type: "generated",
    views: 1100,
    downloads: 300,
  },
   {
    prompt: "Futuristic mecha robot, detailed schematics, green interface, pixel art",
    width: 2560,
    height: 4096, // 9:16
    imageKey: "https://placehold.co/576x1024/001100/00FF00/png?text=Mecha\nRobot&font=roboto",
    type: "generated",
    views: 1800,
    downloads: 410,
  },
  {
    prompt: "Peaceful farm landscape, stardew valley vibe, sunny day",
    width: 4096,
    height: 2304, // 16:9
    imageKey: "https://placehold.co/1024x576/88CC00/FFFFFF/png?text=Farm\nLife&font=roboto",
    type: "generated",
    views: 4200,
    downloads: 950,
  }
];

export async function POST() {
  try {
    const results = [];
    for (const data of mockData) {
      const res = await imageManager.createImage(data);
      // Simulate some random views/downloads to make it look alive if not set (though mockData has them)
      // Actually imageManager.createImage respects passed values if schema allows, 
      // but schema might default them to 0. 
      // Let's check schema: schema says default(0).
      // insertGalleryImageSchema picks views/downloads, so it should work.
      results.push(res);
    }
    return NextResponse.json({ success: true, count: results.length, data: results });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
