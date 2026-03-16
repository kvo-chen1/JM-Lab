"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Sparkles, Image as ImageIcon, Eye } from "lucide-react";
import { toast } from "sonner";

export default function CreatePage() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 font-pixel">
      <h1 className="text-3xl font-bold mb-8">创建像素画</h1>
      <GenerateView />
    </div>
  );
}

function GenerateView() {
  const [prompt, setPrompt] = useState("");
  // Ensure we explicitly have a value, although Select defaultValue should handle UI,
  // the state needs to be consistent. 
  const [ratio, setRatio] = useState("9:16");
  
  // Debug log to verify state changes
  // useEffect(() => console.log("Ratio state:", ratio), [ratio]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      // Explicitly log what we are sending
      console.log("Sending generate request:", { prompt, ratio });
      
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            prompt, 
            // Fallback to "9:16" if ratio is somehow empty, though useState init handles this.
            ratio: ratio || "9:16" 
        }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      setResult(data);
      toast.success("生成成功！");
    } catch (error: any) {
      toast.error(error.message || "生成失败");
    } finally {
      setLoading(false);
    }
  }

  const handleDownload = async () => {
    if (!result?.url) return;
    try {
        const response = await fetch(result.url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `generated-${result.id}.jpg`;
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        toast.success("已开始下载");
    } catch (error) {
        console.error("Download failed:", error);
        toast.error("下载失败，请重试");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 h-[70vh]">
      <div className="flex flex-col gap-6 p-6 border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] bg-white rounded-none">
        <div className="space-y-2">
            <Label className="font-bold text-lg">提示词</Label>
            <Textarea 
                placeholder="描述你想要生成的像素画..." 
                className="h-32 resize-none border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all bg-gray-50 font-sans"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
        </div>
        
        <div className="space-y-2">
            <Label className="font-bold text-lg">像素画比例</Label>
            <Select value={ratio} onValueChange={setRatio}>
                <SelectTrigger className="border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] h-12 bg-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-black rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                    <SelectItem value="9:16" className="rounded-none cursor-pointer focus:bg-primary focus:text-white">9:16 (竖屏)</SelectItem>
                    <SelectItem value="3:4" className="rounded-none cursor-pointer focus:bg-primary focus:text-white">3:4 (人像)</SelectItem>
                    <SelectItem value="1:1" className="rounded-none cursor-pointer focus:bg-primary focus:text-white">1:1 (正方形)</SelectItem>
                    <SelectItem value="16:9" className="rounded-none cursor-pointer focus:bg-primary focus:text-white">16:9 (横屏)</SelectItem>
                    <SelectItem value="4:3" className="rounded-none cursor-pointer focus:bg-primary focus:text-white">4:3 (经典)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="mt-auto">
            <Button 
                className="w-full h-14 text-lg border-2 border-black rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] bg-primary hover:bg-primary/90 text-white font-bold transition-all" 
                onClick={handleGenerate} 
                disabled={loading || !prompt.trim()}
            >
                {loading ? (
                    <><Loader2 className="mr-2 animate-spin" /> 绘制中...</>
                ) : (
                    <><Sparkles className="mr-2" /> 生成像素画</>
                )}
            </Button>
        </div>
      </div>

      <div className="flex flex-col border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] bg-neutral-100 relative overflow-hidden group h-full rounded-none pattern-dots">
        {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="font-pixel text-lg animate-pulse">正在绘制您的像素艺术...</p>
            </div>
        ) : result ? (
            <div className="relative w-full h-full flex flex-col min-h-0">
                <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
                     <img src={result.url} alt="Generated" className="max-w-full max-h-full shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-2 border-black bg-white object-contain image-pixelated" />
                </div>
                <div className="flex-shrink-0 p-4 bg-white border-t-2 border-black flex justify-end gap-2 z-10">
                     <Button variant="outline" asChild className="border-2 border-black rounded-none hover:bg-gray-100">
                         <a href={result.url} target="_blank" rel="noopener noreferrer">
                             <Eye className="mr-2 w-4 h-4" /> 查看像素大图
                         </a>
                     </Button>
                     <Button onClick={handleDownload} className="border-2 border-black rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] bg-primary text-white hover:bg-primary/90">
                         <Download className="mr-2 w-4 h-4" /> 下载像素画
                     </Button>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                <ImageIcon className="w-16 h-16" />
                <p className="font-pixel">像素画预览</p>
            </div>
        )}
      </div>
    </div>
  );
}
