// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import axios from "axios";

const inter = Inter({ subsets: ["latin"] });

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
  
  // Verifica se la pagina corrente è la pagina di login
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

  // Verifica autenticazione all'avvio se non siamo nella pagina di login
  useEffect(() => {
    if (!isLoginPage) {
      const checkAuth = async () => {
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";
          const response = await axios.get(`${API_BASE_URL}/api/check-auth`, {
            withCredentials: true
          });
          
          // Controlla se la risposta è HTML (pagina di login) invece di JSON
          if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
            console.log("Ricevuta pagina HTML, reindirizzamento a login");
            setIsAuthenticated(false);
            router.push(`/login?redirectTo=${encodeURIComponent(pathname || '/')}`);
            return;
          }
          
          setIsAuthenticated(response.data.authenticated);
          if (!response.data.authenticated) {
            router.push(`/login?redirectTo=${encodeURIComponent(pathname || '/')}`);
          }
        } catch (error) {
          console.error("Errore verifica autenticazione:", error);
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

  // Mostra un loader durante la verifica dell'autenticazione
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
            // Layout semplificato per la pagina di login
            <div className="min-h-screen">
              {children}
            </div>
          ) : (
            // Layout standard con sidebar e header per le altre pagine
            <div className="flex h-screen overflow-hidden">
              <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} isMobile={isMobile} />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 bg-zinc-900 pt-2 overflow-y-auto">
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