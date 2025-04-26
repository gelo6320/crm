// components/layout/Sidebar.tsx
"use client";

import { 
  BarChart3, Calendar, FileText, Bookmark, 
  Facebook, Share2, Users, Settings, LogOut,
  X, Globe, Shield, ChevronDown, ChevronRight, HardHat
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  adminOnly?: boolean; // Optional property for admin-only links
  children?: SidebarLink[]; // Optional submenu
}

export default function Sidebar({ open, setOpen, isMobile }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const { isAdmin } = useAuthz(); // Use authorization hook
    const router = useRouter();
    const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});

    const handleLogout = async () => {
        try {
          await logout();
        } catch (error) {
          console.error('Error during logout:', error);
        }
    };

    // Check if current path is part of menu or sub-item
    useEffect(() => {
      const expandedState: { [key: string]: boolean } = {};
      
      // Auto-expand menus containing current path
      const checkPathInChildren = (links: SidebarLink[]) => {
        links.forEach(link => {
          if (link.children) {
            const isActive = link.children.some(child => 
              pathname === child.href || pathname.startsWith(child.href + '/')
            );
            
            if (isActive) {
              expandedState[link.name] = true;
            }
            
            checkPathInChildren(link.children);
          }
        });
      };
      
      checkPathInChildren(contactsLinks);
      
      setExpandedMenus(expandedState);
    }, [pathname]);
  
    // Common links for all users (excluding contacts)
    const commonLinks: SidebarLink[] = [
      { name: "Dashboard", href: "/", icon: BarChart3 }, // Now first in the list
      { name: "Calendario", href: "/calendar", icon: Calendar },
      { name: "Eventi Facebook", href: "/events", icon: Share2 },
      { name: "Sales Funnel", href: "/sales-funnel", icon: Users },
      { name: "I tuoi siti", href: "/my-sites", icon: Globe },
      { name: "Progetti", href: "/projects", icon: ConstructionIcon },
    ];

    // Contacts menu with submenu
    const contactsLinks: SidebarLink[] = [
      { 
        name: "Contatti", 
        href: "/contacts", 
        icon: Users,
        children: [
          { name: "Tutti i contatti", href: "/contacts", icon: Users },
          { name: "Form di contatto", href: "/forms", icon: FileText },
          { name: "Lead Facebook", href: "/facebook-leads", icon: Facebook },
          { name: "Prenotazioni", href: "/bookings", icon: Bookmark },
        ]
      }
    ];
  
    // Admin-only links
    const adminLinks: SidebarLink[] = [
      { name: "Sales Funnel Admin", href: "/sales-funnel-admin", icon: Shield, adminOnly: true },
      // Add other admin links here
    ];
  
    // Settings available to all but kept separate
    const settingsLink: SidebarLink = { name: "Impostazioni", href: "/settings", icon: Settings };
  
    // Filter admin links if needed
    const links: SidebarLink[] = [
      ...commonLinks, // Dashboard now comes first
      ...contactsLinks,
      ...(isAdmin() ? adminLinks : []),
      settingsLink
    ];
  
    // Function to expand/collapse a menu
    const toggleMenu = (menuName: string) => {
      setExpandedMenus(prev => ({
        ...prev,
        [menuName]: !prev[menuName]
      }));
    };
  
    // Close sidebar function for mobile
    const closeSidebar = () => {
      if (isMobile) {
        setOpen(false);
      }
    };
  
    // Render a sidebar link, recursively handling submenus
    const renderLink = (link: SidebarLink) => {
      const Icon = link.icon;
      const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
      const hasChildren = link.children && link.children.length > 0;
      const isExpanded = expandedMenus[link.name] || false;
      
      // If a submenu item is active, consider this as active too
      const isChildActive = hasChildren && link.children!.some(
        child => pathname === child.href || pathname.startsWith(child.href + '/')
      );
      
      return (
        <div key={link.name} className="space-y-1">
          {/* Main link or button to open submenu */}
          {hasChildren ? (
            <button
              onClick={() => toggleMenu(link.name)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive || isChildActive 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}
                ${link.adminOnly ? 'border-r-2 border-primary' : ''}
              `}
            >
              <div className="flex items-center">
                <Icon size={18} className={`mr-2 ${isActive || isChildActive ? 'text-primary' : ''}`} />
                {link.name}
              </div>
              {isExpanded ? 
                <ChevronDown size={14} className={isActive || isChildActive ? 'text-primary' : ''} /> : 
                <ChevronRight size={14} className={isActive || isChildActive ? 'text-primary' : ''} />
              }
            </button>
          ) : (
            <Link
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
          )}
          
          {/* Submenu */}
          {hasChildren && isExpanded && (
            <div className="pl-10 space-y-1 animate-fade-in">
              {link.children!.map(childLink => (
                <Link
                  key={childLink.name}
                  href={childLink.href}
                  onClick={closeSidebar}
                  className={`
                    flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${pathname === childLink.href 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700'}
                  `}
                >
                  <childLink.icon size={16} className={`mr-2 ${pathname === childLink.href ? 'text-primary' : ''}`} />
                  {childLink.name}
                </Link>
              ))}
            </div>
          )}
        </div>
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