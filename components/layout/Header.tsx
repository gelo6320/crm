// components/layout/Header.tsx
"use client";

import { Bell, Menu, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const getHeaderTitle = () => {
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/forms":
        return "Form di contatto";
      case "/bookings":
        return "Prenotazioni";
      case "/facebook-leads":
        return "Lead Facebook";
      case "/calendar":
        return "Calendario";
      case "/events":
        return "Eventi Facebook";
      case "/sales-funnel":
        return "Sales Funnel";
      case "/settings":
        return "Impostazioni";
      default:
        return "Dashboard";
    }
  };
  
  return (
    <header className="bg-black border-b border-zinc-800 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-zinc-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="hidden md:block">
              <Image 
                src="/logosito.webp" 
                width={30} 
                height={20} 
                alt="Logo" 
                className="h-6 w-9"
              />
            </div>
            <span className="font-semibold text-sm md:text-base">
              {getHeaderTitle()}
            </span>
          </div>
        </div>
        
        <div className="relative flex-1 max-w-md mx-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <Search size={16} className="text-zinc-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-full w-full py-1.5 pl-8 pr-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Cerca..."
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="text-zinc-400 hover:text-white">
            <Bell size={18} />
          </button>
          
          <div ref={userMenuRef} className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center h-8 w-8 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 hover:border-primary transition-colors"
            >
              <User size={16} />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg animate-fade-in z-50">
                <div className="py-1.5 px-3 border-b border-zinc-700">
                  <p className="text-sm font-medium">Amministratore</p>
                  <p className="text-xs text-zinc-400">admin@costruzionedigitale.com</p>
                </div>
                <div className="py-1">
                  <button 
                    className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700"
                  >
                    Profilo
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}