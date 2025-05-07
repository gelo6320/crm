// components/layout/Sidebar.tsx
import { 
  BarChart3, Calendar, FileText, Bookmark, 
  Facebook, Share2, Users, Settings, LogOut,
  X, Globe, Shield, HardHat, LineChart, Filter
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import useAuthz from "@/lib/auth/useAuthz";
import { useState, useEffect } from "react";

const ConstructionIcon = ({ size = 18, className = "" }) => {
  return <HardHat size={size} className={className} />;
};

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
}

// Define interface for sidebar links
interface SidebarLink {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

export default function Sidebar({ open, setOpen, isMobile }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const { isAdmin } = useAuthz();
    const router = useRouter();

    const handleLogout = async () => {
        try {
          await logout();
        } catch (error) {
          console.error('Error during logout:', error);
        }
    };

    // Common links for all users
    const commonLinks: SidebarLink[] = [
      { name: "Dashboard", href: "/", icon: BarChart3 },
      { name: "Contatti", href: "/contacts", icon: Users },
      { name: "Tracciamento", href: "/tracciamento", icon: LineChart },
      { name: "Sales Funnel", href: "/sales-funnel", icon: Filter },
      { name: "Calendario", href: "/calendar", icon: Calendar },
      { name: "I tuoi siti", href: "/my-sites", icon: Globe },
      { name: "Progetti", href: "/projects", icon: ConstructionIcon },
      { name: "Eventi Facebook", href: "/events", icon: Share2 },
    ];
  
    // Admin-only links
    const adminLinks: SidebarLink[] = [
      { name: "Sales Funnel Admin", href: "/sales-funnel-admin", icon: Shield, adminOnly: true },
    ];
  
    // Settings available to all but kept separate
    const settingsLink: SidebarLink = { name: "Impostazioni", href: "/settings", icon: Settings };
  
    // Filter admin links if needed
    const links: SidebarLink[] = [
      ...commonLinks,
      ...(isAdmin() ? adminLinks : []),
      settingsLink
    ];
  
    // Close sidebar function for mobile
    const closeSidebar = () => {
      if (isMobile) {
        setOpen(false);
      }
    };
  
    // Render a sidebar link
    const renderLink = (link: SidebarLink) => {
      const Icon = link.icon;
      const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
      
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
            ${link.adminOnly ? 'border-r-2 border-primary' : ''}
          `}
        >
          <Icon size={18} className={`mr-2 ${isActive ? 'text-primary' : ''}`} />
          {link.name}
        </Link>
      );
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
        
        {/* Sidebar - Notare che abbiamo rimosso l'header della sidebar */}
        <div 
          className={`
            fixed top-0 left-0 z-40 h-full w-64 bg-black border-r border-zinc-800 
            transform transition-transform duration-300 ease-in-out 
            ${isMobile ? (open ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
            md:relative md:z-0 md:translate-x-0 pt-[57px] mt-px
          `}
        >
          {/* Sidebar links - Inizia direttamente con i link */}
          <div className="py-3 overflow-y-auto h-[calc(100vh-57px)]">
            <nav className="px-2 space-y-1">
              {links.map(renderLink)}
            </nav>
            
            {/* Logout button */}
            <div className="mt-6 px-4">
              <div className="border-t border-zinc-800 pt-4">
              <button 
                onClick={handleLogout} 
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-zinc-400 rounded-md hover:text-white hover:bg-zinc-800 transition-colors"
              >
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