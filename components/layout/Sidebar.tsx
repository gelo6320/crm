// components/layout/Sidebar.tsx
import { 
  BarChart3, Calendar, FileText, Bookmark, 
  Facebook, Share2, Users, Settings, LogOut,
  X, Globe, Shield, HardHat, LineChart, Filter, Vault,
  Target
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import useAuthz from "@/lib/auth/useAuthz";

const ConstructionIcon = ({ size = 18, className = "" }) => {
  return <HardHat size={size} className={className} />;
};

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
  isHovered?: boolean;
}

// Define interface for sidebar links
interface SidebarLink {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

export default function Sidebar({ open, setOpen, isMobile, isHovered = false }: SidebarProps) {
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
      { name: "Banca Dati", href: "/banca-dati", icon: Vault },
      { name: "Pubblicità", href: "/pubblicita", icon: Target },
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

    // Determine if sidebar should be expanded
    const isExpanded = isMobile ? open : isHovered;
    const sidebarWidth = isExpanded ? 'w-64' : 'w-16';
  
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
            group relative flex items-center rounded-lg text-sm font-medium transition-all duration-200
            ${isExpanded ? 'px-3 py-2' : 'px-2 py-2 justify-center'}
            ${isActive 
              ? 'bg-primary/10 text-primary' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}
            ${link.adminOnly ? 'border-r-2 border-primary' : ''}
          `}
        >
          <Icon 
            size={18} 
            className={`${isActive ? 'text-primary' : ''} ${isExpanded ? 'mr-3' : ''} transition-all duration-200`} 
          />
          
          {/* Text with animation */}
          <span className={`
            whitespace-nowrap transition-all duration-200 
            ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
            ${!isExpanded && 'sr-only'}
          `}>
            {link.name}
          </span>

          {/* Tooltip for minimized state */}
          {!isExpanded && (
            <div className="
              absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md
              opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50
              pointer-events-none whitespace-nowrap border border-zinc-700
            ">
              {link.name}
            </div>
          )}

          {/* Active indicator for minimized state */}
          {!isExpanded && isActive && (
            <div className="absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full" />
          )}
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
        
        {/* Sidebar */}
        <div 
          className={`
            fixed top-0 left-0 z-40 h-full bg-black border-r border-zinc-800 
            transform transition-all duration-300 ease-in-out 
            ${isMobile ? 
              (open ? 'translate-x-0 w-64' : '-translate-x-full w-64') : 
              `translate-x-0 ${sidebarWidth}`
            }
            md:relative md:z-0 md:translate-x-0 pt-[57px] mt-px
          `}
        >
          {/* Sidebar content */}
          <div className="py-3 overflow-hidden h-[calc(100vh-57px)] flex flex-col">
            {/* Navigation links */}
            <nav className={`px-2 space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent ${isExpanded ? '' : 'scrollbar-hide'}`}>
              {links.map(renderLink)}
            </nav>
            
            {/* Logout button */}
            <div className={`mt-6 ${isExpanded ? 'px-4' : 'px-2'}`}>
              <div className="border-t border-zinc-800 pt-4">
                <button 
                  onClick={handleLogout} 
                  className={`
                    group relative flex items-center text-sm font-medium text-zinc-400 rounded-lg hover:text-white hover:bg-zinc-800 transition-all duration-200
                    ${isExpanded ? 'w-full px-3 py-2' : 'px-2 py-2 justify-center'}
                  `}
                >
                  <LogOut size={18} className={`${isExpanded ? 'mr-3' : ''} transition-all duration-200`} />
                  
                  {/* Text with animation */}
                  <span className={`
                    whitespace-nowrap transition-all duration-200 
                    ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                    ${!isExpanded && 'sr-only'}
                  `}>
                    Logout
                  </span>

                  {/* Tooltip for minimized state */}
                  {!isExpanded && (
                    <div className="
                      absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded-md
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50
                      pointer-events-none whitespace-nowrap border border-zinc-700
                    ">
                      Logout
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
}