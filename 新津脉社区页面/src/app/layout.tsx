import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: 'AI 作品分享社区',
  description: 'AI Generated Art Community',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background">
        <Sidebar />
        <main className="md:pl-[88px] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
