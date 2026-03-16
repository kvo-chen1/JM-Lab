"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Plus, Compass } from "lucide-react"; // Using Plus instead of PlusSquare for cleaner look
import { cn } from "@/lib/utils";

const items = [
  {
    title: "像素广场",
    href: "/",
    icon: Home,
  },
  {
    title: "像素工坊",
    href: "/create",
    icon: Plus,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col w-[88px] min-h-screen bg-sidebar items-center fixed left-0 top-0 z-50 py-6 border-r-2 border-sidebar-border shadow-[2px_0_0_0_rgba(0,0,0,1)]">
      {/* Logo Area */}
      <div className="mb-auto p-2">
        <Link href="/" className="relative w-12 h-12 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
             <Image src="/next.svg" alt="Logo" width={30} height={30} className="object-contain invert dark:invert-0" priority />
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
                  "w-12 h-12 flex items-center justify-center border-2 transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                    : "bg-white text-sidebar-foreground border-black hover:bg-gray-100 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive ? "stroke-2" : "stroke-[1.5]")} />
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-2 mb-4">
        {/* Placeholder for Profile or Settings */}
         <div className="w-12 h-12 flex items-center justify-center border-2 border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer text-foreground active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            <Compass className="w-6 h-6" />
         </div>
      </div>
    </div>
  );
}
