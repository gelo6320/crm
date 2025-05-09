// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import "./dnd-kit-funnel.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import axios from "axios";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if current page is login page
  const isLoginPage = pathname === "/login";

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

  // Check authentication on startup if not on login page
  useEffect(() => {
    if (!isLoginPage) {
      const checkAuth = async () => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";
          const response = await axios.get(`${API_BASE_URL}/api/check-auth`, {
            withCredentials: true
          });
          
          // Check if response is HTML (login page) instead of JSON
          if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            console.log("Received HTML page, redirecting to login");
            setIsAuthenticated(false);
            router.push(`/login?redirectTo=${encodeURIComponent(pathname || '/')}`);
            return;
          }
          
          setIsAuthenticated(response.data.authenticated);
          if (!response.data.authenticated) {
            router.push(`/login?redirectTo=${encodeURIComponent(pathname || '/')}`);
          } else if (pathname === '/') {
            // If authenticated and at root path, redirect to dashboard
            router.push('/');
          }
        } catch (error) {
          console.error("Authentication check error:", error);
          setIsAuthenticated(false);
          router.push('/login');
        } finally {
          setIsLoading(false);
        }
      };
      
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [isLoginPage, pathname, router]);

  // Show loader during authentication check
  if (isLoading && !isLoginPage) {
    return (
      <html lang="it" className="dark">
        <body className={`${inter.className} bg-black text-white flex items-center justify-center min-h-screen`}>
          <div className="animate-spin h-12 w-12 border-t-2 border-primary"></div>
        </body>
      </html>
    );
  }

  return (
    <html lang="it" className="dark">
      <body className={`${inter.className} bg-black text-white min-h-screen overflow-x-hidden`}>
        <AuthProvider>
          {isLoginPage ? (
            // Simple layout for login page
            <div className="min-h-screen">
              {children}
            </div>
          ) : (
            // Layout modificato con header sopra la sidebar
            <div className="flex flex-col h-screen overflow-hidden">
              {/* Header ora è fuori dalla sidebar e si estende su tutta la larghezza */}
              <Header setSidebarOpen={setSidebarOpen} />
              
              {/* Contenitore principale sotto l'header */}
              <div className="flex flex-1 overflow-hidden pt-[1px]">
                {/* Sidebar */}
                <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} isMobile={isMobile} />
                
                {/* Contenuto principale */}
                <main className="flex-1 bg-zinc-900 overflow-y-auto">
                  <div className="px-3 py-2 md:p-6 max-w-full">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          )}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}