// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Close sidebar on route change on mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  return (
    <html lang="it" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen overflow-x-hidden`}>
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} isMobile={isMobile} />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header setSidebarOpen={setSidebarOpen} />
              <main className="flex-1 overflow-y-auto bg-zinc-900 pt-2">
                <div className="px-3 py-2 md:p-6 max-w-full">
                  {children}
                </div>
              </main>
            </div>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}