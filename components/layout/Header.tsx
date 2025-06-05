// components/layout/Header.tsx
"use client";

import { 
  Bell, Menu, Search, User, X, Loader2, 
  Calendar as CalendarIcon, Users, Briefcase, UserCog, RotateCcw,
  MessageCircle, Globe, Database, TrendingUp
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { getUsers, switchUser, restoreAdmin, checkAuth } from "@/lib/api/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Define the SearchResult type for suggestions with all new fields
interface SearchResult {
  id: string;
  leadId?: string;
  name: string;
  email?: string;
  phone?: string;
  section: string;
  sectionPath: string;
  type?: string;
  status?: string;
  // Calendar
  start?: string;
  end?: string;
  description?: string;
  // Projects
  client?: string;
  // WhatsApp
  startTime?: string;
  // Banca Dati
  timestamp?: string;
  location?: string;
  ip?: string;
  value?: number;
  source?: string;
  lastSeen?: string;
  createdAt?: string;
}

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

interface User {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
}

export default function Header({ setSidebarOpen }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [originalAdmin, setOriginalAdmin] = useState<any>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const userSwitcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (userSwitcherRef.current && !userSwitcherRef.current.contains(event.target as Node)) {
        setShowUserSwitcher(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Nuovo useEffect per verificare stato utente
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const authResult = await checkAuth();
        if (authResult.authenticated && authResult.user) {
          setCurrentUser(authResult.user);
          setIsAdmin(authResult.user.role === 'admin');
          
          // Verifica se stiamo impersonando (potresti dover aggiungere questo al checkAuth)
          // Per ora assumiamo che il backend restituisca queste info
          if ((authResult as any).isImpersonating) {
            setIsImpersonating(true);
            setOriginalAdmin((authResult as any).originalAdmin);
          }
        }
      } catch (error) {
        console.error('Errore nel controllo stato utente:', error);
      }
    };

    checkUserStatus();
  }, []);

  // Funzione per caricare gli utenti
  const loadUsers = async () => {
    if (!isAdmin) return;
    
    setIsLoadingUsers(true);
    try {
      const result = await getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento utenti:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Funzione per cambiare utente
  const handleUserSwitch = async (targetUsername: string) => {
    try {
      const result = await switchUser(targetUsername);
      if (result.success) {
        setCurrentUser(result.user);
        setOriginalAdmin(result.originalAdmin);
        setIsImpersonating(true);
        setShowUserSwitcher(false);
        
        // Ricarica la pagina per applicare le nuove configurazioni
        window.location.reload();
      } else {
        alert(result.message || 'Errore nel cambio utente');
      }
    } catch (error) {
      console.error('Errore nel cambio utente:', error);
      alert('Errore nel cambio utente');
    }
  };

  // Funzione per ripristinare admin
  const handleRestoreAdmin = async () => {
    try {
      const result = await restoreAdmin();
      if (result.success) {
        setCurrentUser(result.user);
        setIsImpersonating(false);
        setOriginalAdmin(null);
        setShowUserSwitcher(false);
        
        // Ricarica la pagina per applicare le configurazioni originali
        window.location.reload();
      } else {
        alert(result.message || 'Errore nel ripristino admin');
      }
    } catch (error) {
      console.error('Errore nel ripristino admin:', error);
      alert('Errore nel ripristino admin');
    }
  };
  
  // Search functionality with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedResultIndex(-1);
  }, [searchResults]);

  // Effect to scroll selected item into view
  useEffect(() => {
    if (selectedResultIndex >= 0 && showSearchResults) {
      const selectedElement = document.getElementById(`search-result-${selectedResultIndex}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedResultIndex, showSearchResults]);

  // Function to perform the search
  const performSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) return;
    
    setIsSearching(true);
    try {
      // Use the global search API to get results from multiple sections
      const response = await axios.get(`${API_BASE_URL}/api/global-search?query=${encodeURIComponent(searchQuery)}&limit=10`,
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.data.length > 0) {
        setSearchResults(response.data.data);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error("Error performing search:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle keyboard navigation for search results
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchResults || searchResults.length === 0) return;
    
    // Down arrow - select next result
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    }
    
    // Up arrow - select previous result
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex(prev => prev > 0 ? prev - 1 : 0);
    }
    
    // Enter - navigate to selected result
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
        handleSearchResultClick(searchResults[selectedResultIndex]);
      } else if (searchResults.length > 0) {
        // If no result is specifically selected, use the first one
        handleSearchResultClick(searchResults[0]);
      }
    }
    
    // Escape - close search results
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSearchResults(false);
      setSelectedResultIndex(-1);
      searchInputRef.current?.blur();
    }
  };

  // Handle clicking on a search result
  const handleSearchResultClick = (result: SearchResult) => {
    setShowSearchResults(false);
    setSearchQuery("");
    
    // Navigate to the right section with the ID parameter
    router.push(`${result.sectionPath}?id=${result.id}`);
  };

  // Helper functions for search results rendering
  const getResultIcon = (result: SearchResult) => {
    if (result.section === "Contatti") {
      return <User size={12} className="text-primary" />;
    } else if (result.section === "Sales Funnel") {
      return <TrendingUp size={12} className="text-orange-500" />;
    } else if (result.section === "Calendario") {
      return <CalendarIcon size={12} className="text-blue-400" />;
    } else if (result.section === "Progetti") {
      return <Briefcase size={12} className="text-green-400" />;
    } else if (result.section === "Chat WhatsApp") {
      return <MessageCircle size={12} className="text-green-500" />;
    } else if (result.section.includes("Banca Dati")) {
      if (result.type === 'visit') {
        return <Globe size={12} className="text-purple-400" />;
      } else if (result.type === 'client') {
        return <Users size={12} className="text-blue-500" />;
      } else if (result.type === 'audience') {
        return <TrendingUp size={12} className="text-orange-400" />;
      }
      return <Database size={12} className="text-gray-400" />;
    }
    return <Search size={12} className="text-gray-400" />;
  };

  const getSecondaryInfo = (result: SearchResult) => {
    if (result.section === "Contatti") {
      return result.email || result.phone || '';
    } else if (result.section === "Sales Funnel") {
      return `${result.email || result.phone || ''} • ${result.status || 'new'}`;
    } else if (result.section === "Calendario" && result.start) {
      return `${new Date(result.start).toLocaleDateString('it-IT')} ${new Date(result.start).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (result.section === "Progetti" && result.client) {
      return `Cliente: ${result.client}`;
    } else if (result.section === "Chat WhatsApp") {
      return result.phone || 'Conversazione WhatsApp';
    } else if (result.section.includes("Banca Dati")) {
      if (result.type === 'visit') {
        return `${result.location || result.ip || ''} • ${result.timestamp ? new Date(result.timestamp).toLocaleDateString('it-IT') : ''}`;
      } else if (result.type === 'client') {
        return `${result.email || ''} • ${result.value ? `€${result.value.toLocaleString('it-IT')}` : ''}`;
      } else if (result.type === 'audience') {
        return `${result.email || ''} • ${result.source || 'Facebook'}`;
      }
    }
    return '';
  };

  const getStatusColor = (result: SearchResult) => {
    if (result.status) {
      switch (result.status) {
        case 'new': return 'bg-zinc-600';
        case 'contacted': return 'bg-blue-600';
        case 'qualified': return 'bg-purple-600';
        case 'opportunity': return 'bg-yellow-600';
        case 'customer': case 'converted': return 'bg-green-600';
        case 'lost': case 'cancelled': return 'bg-red-600';
        case 'pending': return 'bg-orange-600';
        case 'confirmed': return 'bg-green-600';
        case 'completed': return 'bg-gray-600';
        case 'active': return 'bg-green-600';
        default: return 'bg-zinc-600';
      }
    }
    return '';
  };

  const getHeaderTitle = () => {
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/calendar":
        return "Calendario";
      case "/events":
        return "Eventi Facebook";
      case "/sales-funnel":
        return "Sales Funnel";
      case "/tracciamento":
        return "Tracciamento";
      case "/pubblicita":
        return "Pubblicità";
      case "/settings":
        return "Impostazioni";
      case "/contacts":
        return "Contatti";
      case "/banca-dati":
        return "Banca Dati";
      case "/my-sites":
        return "I tuoi siti";
      case "/projects":
        return "Progetti";
      case "/whatsapp":
        return "WhatsApp";
      default:
        return "Dashboard";
    }
  };
  
  return (
    <header className="bg-black/90 backdrop-blur-md sticky top-0 z-[60] w-full shadow-lg">
      <div className="relative flex items-center px-4 py-2.5">
        {/* Left section with logo and title */}
        <div className="flex items-center space-x-4 z-10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-zinc-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center space-x-3">
            {/* Admin User Switcher */}
            {(isAdmin || isImpersonating || originalAdmin) && (
              <div className="relative" ref={userSwitcherRef}>
                <button
                  onClick={() => {
                    setShowUserSwitcher(!showUserSwitcher);
                    if (!showUserSwitcher) {
                      loadUsers();
                    }
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    isImpersonating 
                      ? 'bg-orange-600 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={isImpersonating 
                    ? `Stai operando come: ${currentUser?.username}` 
                    : 'Cambia profilo utente (Admin)'
                  }
                >
                  <UserCog size={16} />
                </button>

                {showUserSwitcher && (
                  <div className="absolute left-0 mt-2 w-64 bg-zinc-800/95 backdrop-blur-sm rounded-md shadow-lg z-50">
                    <div className="p-3 border-b border-zinc-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 uppercase tracking-wide">
                          Gestione Utenti
                        </span>
                        {isImpersonating && (
                          <button
                            onClick={handleRestoreAdmin}
                            className="text-xs bg-orange-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-orange-700"
                            title="Torna al profilo admin"
                          >
                            <RotateCcw size={10} />
                            Ripristina Admin
                          </button>
                        )}
                      </div>
                      
                      {isImpersonating && (
                        <div className="mt-2 p-2 bg-orange-900/30 rounded text-xs">
                          <div className="text-orange-200">
                            👤 Profilo corrente: <strong>{currentUser?.username}</strong>
                          </div>
                          <div className="text-zinc-400">
                            🔧 Admin originale: {originalAdmin?.username}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {isLoadingUsers ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 size={16} className="animate-spin text-zinc-400" />
                          <span className="ml-2 text-sm text-zinc-400">Caricamento...</span>
                        </div>
                      ) : (
                        <div className="py-1">
                          {users.map((user) => (
                            <button
                              key={user._id}
                              onClick={() => handleUserSwitch(user.username)}
                              disabled={currentUser?.username === user.username}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-700/50 transition-colors ${
                                currentUser?.username === user.username
                                  ? 'bg-zinc-700/50 text-white'
                                  : 'text-zinc-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{user.username}</div>
                                  <div className="text-xs text-zinc-400">
                                    {user.role === 'admin' ? '👑 Admin' : '👤 Utente'}
                                  </div>
                                </div>
                                {currentUser?.username === user.username && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Logo che ora è sempre visibile */}
            <Link href="/" className="flex items-center space-x-2 text-white hover:text-primary transition hidden md:flex">

              <Image 
                src="/logosito.webp" 
                width={30} 
                height={20} 
                alt="Logo" 
                className="h-6 w-9"
              />
              <div className="font-semibold text-sm hidden md:block">
                <span>Costruzione </span>
                <span className="text-primary">Digitale</span>
              </div>
            </Link>
            
            {/* Separatore verticale */}
            <div className="h-6 w-px bg-zinc-700/50 hidden md:block"></div>
            
            <span className="font-semibold text-sm md:text-base hidden md:block">
              {getHeaderTitle()}
            </span>
          </div>
        </div>
        
        {/* Center section with enhanced search */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-lg px-3" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              {isSearching ? (
                <Loader2 size={16} className="text-zinc-300 animate-spin" />
              ) : (
                <Search size={16} className="text-primary relative z-10" />
              )}
            </div>
            <input
              type="text"
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
              className="bg-zinc-900/90 backdrop-blur-sm text-white text-xs rounded-full w-full py-1.5 pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Cerca in tutto il CRM..."
            />
            
            {searchQuery && (
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-white"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Search results dropdown */}
          {showSearchResults && (
            <div className="absolute z-50 mt-1 w-full bg-zinc-800 backdrop-blur-sm rounded-md shadow-lg max-h-80 overflow-auto">
              {searchResults.length === 0 ? (
                <div className="py-3 px-4 text-sm text-zinc-400">
                  {isSearching ? (
                    <div className="flex items-center">
                      <Loader2 size={14} className="animate-spin mr-2" />
                      Ricerca in corso...
                    </div>
                  ) : (
                    'Nessun risultato trovato'
                  )}
                </div>
              ) : (
                <div>
                  <div className="px-4 py-2 text-xs text-zinc-400 bg-zinc-900/50">
                    {searchResults.length} risultati trovati per "{searchQuery}"
                  </div>
                  <ul className="divide-y divide-zinc-700/30">
                    {searchResults.map((result, index) => {
                      const secondaryInfo = getSecondaryInfo(result);
                      const statusColor = getStatusColor(result);
                      
                      return (
                        <li 
                          key={`${result.section}-${result.id}`}
                          id={`search-result-${index}`}
                          className={`cursor-pointer p-3 text-sm transition-colors group ${
                            selectedResultIndex === index 
                              ? 'bg-zinc-700/70' 
                              : 'hover:bg-zinc-700/50'
                          }`}
                          onClick={() => handleSearchResultClick(result)}
                          onMouseEnter={() => setSelectedResultIndex(index)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              {/* Icon */}
                              <div className="flex-shrink-0 mt-0.5">
                                {getResultIcon(result)}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {/* Title */}
                                <div className="font-medium text-white truncate pr-2">
                                  {result.name}
                                </div>
                                
                                {/* Secondary info */}
                                {secondaryInfo && (
                                  <div className="text-xs text-zinc-400 mt-0.5 truncate">
                                    {secondaryInfo}
                                  </div>
                                )}
                                
                                {/* Additional info for specific types */}
                                {result.description && result.section === "Calendario" && (
                                  <div className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                    {result.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Section badge and status */}
                            <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
                              <div className="text-xs text-zinc-400 px-2 py-0.5 bg-zinc-700/50 rounded-full flex items-center gap-1">
                                {getResultIcon(result)}
                                <span className="max-w-20 truncate">{result.section}</span>
                              </div>
                              
                              {/* Status indicator */}
                              {result.status && statusColor && (
                                <div className={`text-xs text-white px-1.5 py-0.5 rounded-full ${statusColor}`}>
                                  {result.status}
                                </div>
                              )}
                              
                              {/* Value for clients */}
                              {result.value && result.value > 0 && (
                                <div className="text-xs text-green-400 font-medium">
                                  €{result.value.toLocaleString('it-IT')}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Show type-specific details on hover */}
                          {selectedResultIndex === index && (
                            <div className="mt-2 pt-2 border-t border-zinc-600/50">
                              <div className="text-xs text-zinc-500">
                                {result.type === 'visit' && result.timestamp && (
                                  <span>Visita del {new Date(result.timestamp).toLocaleString('it-IT')}</span>
                                )}
                                {result.type === 'conversation' && result.startTime && (
                                  <span>Chat iniziata il {new Date(result.startTime).toLocaleString('it-IT')}</span>
                                )}
                                {result.type === 'event' && result.start && result.end && (
                                  <span>
                                    {new Date(result.start).toLocaleDateString('it-IT')} • 
                                    {new Date(result.start).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - 
                                    {new Date(result.end).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                                {result.type === 'audience' && result.lastSeen && (
                                  <span>Ultima attività: {new Date(result.lastSeen).toLocaleDateString('it-IT')}</span>
                                )}
                                {result.createdAt && ['contact', 'client', 'project'].includes(result.type || '') && (
                                  <span>Creato il {new Date(result.createdAt).toLocaleDateString('it-IT')}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}