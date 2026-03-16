"use client";

import { useState, useEffect } from "react";
import { ImageCard } from "@/components/ImageCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Clock, Eye, Download, Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SortBy = "views" | "downloads" | "created_at";
type SortOrder = "asc" | "desc";
type Period = "day" | "week" | "month" | "all";

export default function Home() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [period, setPeriod] = useState<Period>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchImages();
  }, [sortBy, sortOrder, period, debouncedSearch]);

  async function fetchImages() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (sortBy) queryParams.set("sortBy", sortBy);
      if (sortOrder) queryParams.set("sortOrder", sortOrder);
      if (period && period !== "all") queryParams.set("period", period);
      if (debouncedSearch) queryParams.set("search", debouncedSearch);

      const res = await fetch(`/api/images?${queryParams.toString()}`);
      const data = await res.json();
      setImages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
  };

  return (
    <div className="pt-4 px-4 pb-8 max-w-[1800px] mx-auto">
      {/* Top Search & Filter Bar */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 py-4 mb-2 flex flex-col md:flex-row gap-4 items-center justify-between">
         {/* Search Bar */}
         <div className="relative flex-1 w-full max-w-2xl group">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
             </div>
             <Input 
                className="w-full h-12 pl-12 pr-14 rounded-full bg-[#F1F1F1] hover:bg-[#E0E0E0] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#7AB3F5]/30 border-none text-base transition-all shadow-sm" 
                placeholder="搜索灵感..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
             {search && (
                 <div className="absolute inset-y-0 right-2 flex items-center">
                     <button 
                        onClick={() => setSearch("")}
                        className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center text-muted-foreground transition-colors"
                     >
                         <span className="text-xl leading-none">&times;</span>
                     </button>
                 </div>
             )}
         </div>

         {/* Filter Controls */}
         <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
             {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-[130px] h-10 rounded-full border-none bg-muted hover:bg-muted/80 font-semibold focus:ring-0 gap-2">
                    <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="created_at"><div className="flex items-center gap-2"><Clock className="w-4 h-4" /> 发布时间</div></SelectItem>
                    <SelectItem value="views"><div className="flex items-center gap-2"><Eye className="w-4 h-4" /> 浏览热度</div></SelectItem>
                    <SelectItem value="downloads"><div className="flex items-center gap-2"><Download className="w-4 h-4" /> 下载数量</div></SelectItem>
                </SelectContent>
            </Select>

            {/* Sort Order Toggle */}
            <Button 
                variant="secondary"
                size="icon"
                onClick={toggleSortOrder}
                className="rounded-full w-10 h-10 flex-shrink-0 bg-muted hover:bg-muted/80"
                title={sortOrder === "desc" ? "当前：降序 (从高到低)" : "当前：升序 (从低到高)"}
            >
                {sortOrder === "desc" ? <ArrowDownWideNarrow className="w-5 h-5" /> : <ArrowUpNarrowWide className="w-5 h-5" />}
            </Button>
            
            <div className="w-px h-8 bg-border mx-2" />

            {/* Time Period Dropdown */}
             <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[120px] h-10 rounded-full border-none bg-muted hover:bg-muted/80 font-semibold focus:ring-0">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">全部时间</SelectItem>
                    <SelectItem value="day">24小时内</SelectItem>
                    <SelectItem value="week">一周内</SelectItem>
                    <SelectItem value="month">一个月内</SelectItem>
                </SelectContent>
            </Select>
         </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : images.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
             <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                 <Filter className="w-8 h-8 opacity-50" />
             </div>
             <p className="text-lg">未找到相关灵感，试着换个词？</p>
             <Button asChild className="rounded-full mt-2">
                 <a href="/create">创建新作品</a>
             </Button>
         </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4 px-2">
            {images.map((img) => (
                <ImageCard key={img.id} image={img} />
            ))}
        </div>
      )}
    </div>
  );
}
