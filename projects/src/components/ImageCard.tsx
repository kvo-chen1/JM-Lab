import { useState } from "react";
import Image from "next/image";
import { Download, Eye, MoreHorizontal, Share2, ImageOff } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  width: number;
  height: number;
  views: number;
  downloads: number;
}

export function ImageCard({ image }: { image: GalleryImage }) {
  const [imgError, setImgError] = useState(false);
  
  const handleDownload = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `image-${image.id}.jpg`;
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        toast.success("已开始下载");
    } catch (error) {
        console.error("Download failed:", error);
        toast.error("下载失败，请重试");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="mb-4 break-inside-avoid relative group cursor-zoom-in border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 bg-white">
           {/* Image */}
           {imgError ? (
             <div 
               className="w-full bg-muted flex flex-col items-center justify-center p-4 text-muted-foreground border-b-2 border-black"
               style={{ aspectRatio: `${image.width} / ${image.height}` }}
             >
                <ImageOff className="w-8 h-8 mb-2 opacity-50" />
             </div>
           ) : (
             <Image
              src={image.url}
              alt={image.prompt}
              width={image.width}
              height={image.height}
              className="w-full h-auto object-cover block" 
              loading="lazy"
              unoptimized={true}
              onError={() => setImgError(true)}
            />
           )}
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/15 group-hover:bg-black/40 transition-colors duration-200 pointer-events-none" />

          {/* Hover Overlay Controls (Pointer events auto) */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-between">
            
            {/* Top Section */}
            <div className="flex justify-end pointer-events-auto">
                <Button 
                    className="border-2 border-black bg-primary hover:bg-[#ad081b] text-white font-semibold px-5 h-10 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    onClick={(e) => {
                        e.stopPropagation(); 
                        toast.success("已收藏到像素库");
                    }}
                >
                    收藏
                </Button>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col gap-2 pointer-events-auto mt-auto">
                <div className="flex justify-end gap-2">
                    <Button
                        size="icon"
                        className="border-2 border-black bg-white hover:bg-gray-100 text-foreground w-9 h-9 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        onClick={handleDownload}
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button
                        size="icon"
                        className="border-2 border-black bg-white hover:bg-gray-100 text-foreground w-9 h-9 shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </DialogTrigger>
      
      {/* Detail Modal - Enhanced Layout */}
      <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-[1400px] h-[90vh] md:h-[85vh] overflow-hidden bg-background border-2 border-black p-0 shadow-[8px_8px_0_0_rgba(0,0,0,1)] flex flex-col md:flex-row focus:outline-none">
          <DialogTitle className="hidden">Image Detail</DialogTitle>
          
            {/* Left Image Side - Larger Area */}
            <div className="flex-1 md:flex-[1.5] lg:flex-[2] bg-neutral-100 border-r-2 border-black flex items-center justify-center relative overflow-hidden h-[40vh] md:h-full min-w-0 md:min-w-[50%] pattern-dots">
               <div className="relative w-full h-full p-4 flex items-center justify-center">
                   {imgError ? (
                       <div className="flex flex-col items-center text-muted-foreground">
                           <ImageOff className="w-16 h-16 mb-4 opacity-50" />
                           <p>像素源文件丢失</p>
                       </div>
                   ) : (
                       <img 
                         src={image.url} 
                         alt={image.prompt} 
                         className="max-w-full max-h-full object-contain shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-2 border-black bg-white"
                         onError={() => setImgError(true)}
                       />
                   )}
               </div>
            </div>
            
            {/* Right Info Side - Fixed Width on Desktop */}
            <div className="w-full md:w-[400px] flex-shrink-0 p-6 md:p-8 flex flex-col gap-6 bg-background h-full overflow-y-auto">
                <div className="flex items-center justify-between sticky top-0 bg-background z-10 pb-4 border-b-2 border-black">
                     <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="border-2 border-transparent hover:border-black hover:bg-gray-100"><MoreHorizontal /></Button>
                        <Button size="icon" variant="ghost" className="border-2 border-transparent hover:border-black hover:bg-gray-100"><Share2 /></Button>
                     </div>
                     <Button className="border-2 border-black bg-primary hover:bg-[#ad081b] text-white px-6 font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                        收藏
                     </Button>
                </div>

                <div className="space-y-4">
                    {/* Removed prompt display per user request */}
                </div>
                
                <div className="flex items-center gap-4 py-4 border-t-2 border-b-2 border-black border-dashed">
                     <div className="w-10 h-10 border-2 border-black bg-muted flex items-center justify-center font-bold text-muted-foreground">
                         PX
                     </div>
                     <div className="flex-1">
                         <p className="font-semibold text-sm">像素艺术家</p>
                         <p className="text-xs text-muted-foreground">粉丝: 1.2k</p>
                     </div>
                     <Button variant="secondary" className="border-2 border-black font-semibold shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-sm">关注</Button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                     <div className="flex flex-col gap-1 p-2 border-2 border-black bg-gray-50">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                             <Eye className="w-3 h-3" /> 浏览量
                        </span>
                        <span className="font-mono text-lg">{image.views}</span>
                     </div>
                     <div className="flex flex-col gap-1 p-2 border-2 border-black bg-gray-50">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                             <Download className="w-3 h-3" /> 下载量
                        </span>
                        <span className="font-mono text-lg">{image.downloads}</span>
                     </div>
                </div>

                <div className="mt-auto pt-6 flex flex-col gap-4">
                     <Button className="w-full border-2 border-black h-12 text-lg font-semibold shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] bg-white hover:bg-gray-50 text-black" onClick={handleDownload}>
                        下载像素画
                     </Button>
                     
                     <div className="pt-4 border-t-2 border-black">
                         <h3 className="font-semibold mb-3">评论</h3>
                         <p className="text-sm text-muted-foreground">暂无评论。快来抢沙发吧！</p>
                     </div>
                </div>
            </div>
      </DialogContent>
    </Dialog>
  );
}
