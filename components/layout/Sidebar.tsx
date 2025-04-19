// components/layout/Sidebar.tsx
"use client";

import { 
  BarChart3, Calendar, FileText, Bookmark, 
  Facebook, Share2, Users, Settings, LogOut,
  X 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
}

export default function Sidebar({ open, setOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();
  
  const links = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Form di contatto", href: "/forms", icon: FileText },
    { name: "Lead Facebook", href: "/facebook-leads", icon: Facebook },
    { name: "Prenotazioni", href: "/bookings", icon: Bookmark },
    { name: "Calendario", href: "/calendar", icon: Calendar },
    { name: "Eventi Facebook", href: "/events", icon: Share2 },
    { name: "Sales Funnel", href: "/sales-funnel", icon: Users },
    { name: "Impostazioni", href: "/settings", icon: Settings },
  ];
  
  // Close sidebar function for mobile
  const closeSidebar = () => {
    if (isMobile) {
      setOpen(false);
    }
  };
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-black border-r border-zinc-800 
          transform transition-transform duration-300 ease-in-out 
          ${isMobile ? (open ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          md:relative md:z-0 md:translate-x-0
        `}
      >
        {/* Sidebar header */}
        <div className="h-[57px] flex items-center justify-between px-4 border-b border-zinc-800">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-white hover:text-primary transition"
            onClick={closeSidebar}
          >
            <Image 
              src="/logosito.webp" 
              width={30} 
              height={20} 
              alt="Logo" 
              className="h-6 w-8"
            />
            <div className="font-semibold text-sm">
              <span>Costruzione </span>
              <span className="text-primary">Digitale</span>
            </div>
          </Link>
          
          {isMobile && (
            <button 
              onClick={() => setOpen(false)} 
              className="text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Sidebar links */}
        <div className="py-3 overflow-y-auto h-[calc(100vh-57px)]">
          <nav className="px-2 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeSidebar}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}
                  `}
                >
                  <Icon size={18} className={`mr-2 ${isActive ? 'text-primary' : ''}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Logout button */}
          <div className="mt-6 px-4">
            <div className="border-t border-zinc-800 pt-4">
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-zinc-400 rounded-md hover:text-white hover:bg-zinc-800 transition-colors">
                <LogOut size={18} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}