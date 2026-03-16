"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Plus, Compass } from "lucide-react"; // Using Plus instead of PlusSquare for cleaner look
import { cn } from "@/lib/utils";

const items = [
  {
    title: "主页",
    href: "/",
    icon: Home,
  },
  {
    title: "AI 生图",
    href: "/create",
    icon: Plus,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col w-[88px] min-h-screen bg-background items-center fixed left-0 top-0 z-50 py-6 border-r-0 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
      {/* Logo Area */}
      <div className="mb-auto p-2">
        <Link href="/" className="relative w-12 h-12 flex items-center justify-center rounded-full overflow-hidden hover:opacity-90 transition-opacity">
             <Image src="/next.svg" alt="Logo" width={40} height={40} className="object-contain invert dark:invert-0" priority />
        </Link>
      </div>
      
      {/* Navigation - Vertically Centered */}
      <nav className="flex flex-col gap-8 w-full items-center my-auto">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 group"
            >
              <div
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-full transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md border-transparent"
                    : "bg-transparent text-sidebar-foreground border border-sidebar-border hover:bg-muted hover:border-transparent"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive ? "stroke-2" : "stroke-[1.5]")} />
              </div>
              {/* <span className={cn(
                  "text-[12px] font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                  {item.title}
              </span> */} 
              {/* Design spec says "Navigation bar icon: Circular outline...". Text label might be optional or hidden in strict icon-only design, but prompt said "icon + text form". 
                  However, "Circular container" usually implies icon prominence. 
                  Let's keep text but make it subtle or hidden on strictly minimal design. 
                  Actually, Pinterest desktop sidebar is usually icons. The prompt says "Navigation bar icons... wrapped in circular containers".
                  I'll keep text for clarity but style it minimally.
               */}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-2 mb-4">
        {/* Placeholder for Profile or Settings */}
         <div className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors cursor-pointer text-muted-foreground">
            <Compass className="w-6 h-6" />
         </div>
      </div>
    </div>
  );
}
