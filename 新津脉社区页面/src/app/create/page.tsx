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
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">AI 生图</h1>
      <GenerateView />
    </div>
  );
}

function GenerateView() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("9:16");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      console.log("Sending generate request:", { prompt, ratio });
      
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            prompt, 
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
      <div className="flex flex-col gap-6 p-6 border rounded-xl bg-card">
        <div className="space-y-2">
            <Label>提示词</Label>
            <Textarea 
                placeholder="描述你想要生成的画面..." 
                className="h-32 resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
        </div>
        
        <div className="space-y-2">
            <Label>图片比例</Label>
            <Select value={ratio} onValueChange={setRatio}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="9:16">9:16 (竖屏)</SelectItem>
                    <SelectItem value="3:4">3:4 (人像)</SelectItem>
                    <SelectItem value="1:1">1:1 (正方形)</SelectItem>
                    <SelectItem value="16:9">16:9 (横屏)</SelectItem>
                    <SelectItem value="4:3">4:3 (经典)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="mt-auto">
            <Button 
                className="w-full h-12 text-lg" 
                onClick={handleGenerate} 
                disabled={loading || !prompt.trim()}
            >
                {loading ? (
                    <><Loader2 className="mr-2 animate-spin" /> 生成中...</>
                ) : (
                    <><Sparkles className="mr-2" /> 开始生成</>
                )}
            </Button>
        </div>
      </div>

      <div className="flex flex-col border rounded-xl bg-muted/30 relative overflow-hidden group h-full">
        {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p>正在绘制您的梦境...</p>
            </div>
        ) : result ? (
            <div className="relative w-full h-full flex flex-col min-h-0">
                <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden">
                     <img src={result.url} alt="Generated" className="max-w-full max-h-full shadow-lg rounded-md object-contain" />
                </div>
                <div className="flex-shrink-0 p-4 bg-background border-t flex justify-end gap-2 z-10">
                     <Button variant="outline" asChild>
                         <a href={result.url} target="_blank" rel="noopener noreferrer">
                             <Eye className="mr-2 w-4 h-4" /> 查看大图
                         </a>
                     </Button>
                     <Button onClick={handleDownload}>
                         <Download className="mr-2 w-4 h-4" /> 下载图片
                     </Button>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                <ImageIcon className="w-16 h-16" />
                <p>预览区域</p>
            </div>
        )}
      </div>
    </div>
  );
}
