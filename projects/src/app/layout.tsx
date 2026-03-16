import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: '像素艺术工坊',
  description: 'AI Pixel Art Community',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen bg-background font-pixel">
        <Sidebar />
        <main className="md:pl-[88px] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
