"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [columnCount, setColumnCount] = useState(2);

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

  // Responsive column count
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) setColumnCount(2); // md
      else if (w < 1024) setColumnCount(3); // lg
      else if (w < 1280) setColumnCount(4); // xl
      else if (w < 1536) setColumnCount(5); // 2xl
      else setColumnCount(6);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Distribute images into columns
  const columns = useMemo(() => {
    if (!images.length) return [];
    
    // Initialize columns
    const cols = Array.from({ length: columnCount }, () => [] as any[]);
    
    // Distribute
    images.forEach((img, i) => {
      cols[i % columnCount].push(img);
    });
    
    // Filter out empty columns to ensure centering works for few images
    return cols.filter(col => col.length > 0);
  }, [images, columnCount]);

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
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 py-4 mb-2 flex flex-col md:flex-row gap-4 items-center justify-between border-b-2 border-black pb-4">
         {/* Search Bar */}
         <div className="relative flex-1 w-full max-w-2xl group">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                 <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
             </div>
             <Input 
                className="w-full h-12 pl-12 pr-14 border-2 border-black bg-white hover:bg-gray-50 focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-base transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none font-pixel placeholder:font-sans" 
                placeholder="搜索像素艺术..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
             {search && (
                 <div className="absolute inset-y-0 right-2 flex items-center">
                     <button 
                        onClick={() => setSearch("")}
                        className="w-8 h-8 hover:bg-black/10 flex items-center justify-center text-muted-foreground transition-colors border-2 border-transparent hover:border-black active:translate-x-[1px] active:translate-y-[1px]"
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
                <SelectTrigger className="w-[130px] h-10 border-2 border-black bg-white hover:bg-gray-50 font-semibold focus:ring-0 gap-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                    <SelectValue placeholder="排序方式" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-none">
                    <SelectItem value="created_at" className="focus:bg-primary focus:text-white rounded-none cursor-pointer"><div className="flex items-center gap-2"><Clock className="w-4 h-4" /> 发布时间</div></SelectItem>
                    <SelectItem value="views" className="focus:bg-primary focus:text-white rounded-none cursor-pointer"><div className="flex items-center gap-2"><Eye className="w-4 h-4" /> 浏览热度</div></SelectItem>
                    <SelectItem value="downloads" className="focus:bg-primary focus:text-white rounded-none cursor-pointer"><div className="flex items-center gap-2"><Download className="w-4 h-4" /> 下载数量</div></SelectItem>
                </SelectContent>
            </Select>

            {/* Sort Order Toggle */}
            <Button 
                variant="secondary"
                size="icon"
                onClick={toggleSortOrder}
                className="w-10 h-10 flex-shrink-0 border-2 border-black bg-white hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none rounded-none"
                title={sortOrder === "desc" ? "当前：降序 (从高到低)" : "当前：升序 (从低到高)"}
            >
                {sortOrder === "desc" ? <ArrowDownWideNarrow className="w-5 h-5" /> : <ArrowUpNarrowWide className="w-5 h-5" />}
            </Button>
            
            <div className="w-px h-8 bg-black mx-2" />

            {/* Time Period Dropdown */}
             <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[120px] h-10 border-2 border-black bg-white hover:bg-gray-50 font-semibold focus:ring-0 shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-none">
                    <SelectItem value="all" className="focus:bg-primary focus:text-white rounded-none cursor-pointer">全部时间</SelectItem>
                    <SelectItem value="day" className="focus:bg-primary focus:text-white rounded-none cursor-pointer">24小时内</SelectItem>
                    <SelectItem value="week" className="focus:bg-primary focus:text-white rounded-none cursor-pointer">一周内</SelectItem>
                    <SelectItem value="month" className="focus:bg-primary focus:text-white rounded-none cursor-pointer">一个月内</SelectItem>
                </SelectContent>
            </Select>
         </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : images.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
             <div className="w-16 h-16 border-2 border-black bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center">
                 <Filter className="w-8 h-8 opacity-50" />
             </div>
             <p className="text-lg font-pixel">未找到相关像素画，试着换个词？</p>
             <Button asChild className="mt-2 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-none bg-primary text-white hover:bg-primary/90">
                 <a href="/create">创建像素画</a>
             </Button>
         </div>
      ) : (
        <div className="flex justify-center gap-4">
            {columns.map((colImages, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-4 flex-1 min-w-0 max-w-[360px]">
                    {colImages.map((img) => (
                        <ImageCard key={img.id} image={img} />
                    ))}
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
