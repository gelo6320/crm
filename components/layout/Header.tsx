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
// AGGIORNATO: Nuovo import per Motion
import { animate, motion, AnimatePresence } from "motion/react";
import { SmoothCorners } from 'react-smooth-corners';

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
  const [searchTriggerRect, setSearchTriggerRect] = useState<DOMRect | null>(null); // NUOVO STATO per animazione
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
        setSearchTriggerRect(null);
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
        setSearchTriggerRect(null);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedResultIndex(-1);
  }, [searchResults]);

  // Function to perform the search
  const performSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) return;
    
    setIsSearching(true);
    try {
      // Use the global search API to get results from multiple sections
      const response = await axios.get(`${API_BASE_URL}/api/global-search?query=${encodeURIComponent(searchQuery)}&limit=8`,
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.data.length > 0) {
        setSearchResults(response.data.data);
        
        // Ottieni le coordinate dell'input di ricerca per l'animazione
        if (searchInputRef.current) {
          const rect = searchInputRef.current.getBoundingClientRect();
          setSearchTriggerRect(rect);
        }
        
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
        setSearchTriggerRect(null);
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
      setSearchTriggerRect(null);
      setSelectedResultIndex(-1);
      searchInputRef.current?.blur();
    }
  };

  // Handle clicking on a search result - MODIFIED FOR SAME PAGE NAVIGATION
  const handleSearchResultClick = (result: SearchResult) => {
    console.log('Search result clicked:', result);
    setShowSearchResults(false);
    setSearchTriggerRect(null);
    setSearchQuery("");
    
    // Check if we're already on the target page
    const isAlreadyOnTargetPage = pathname === result.sectionPath;
    console.log('Already on target page:', isAlreadyOnTargetPage, 'Current path:', pathname, 'Target path:', result.sectionPath);
    
    if (isAlreadyOnTargetPage) {
      console.log('Same page navigation - dispatching custom event');
      // If we're already on the same page, force a URL update and trigger the highlight
      const url = new URL(window.location.href);
      url.searchParams.set('id', result.id);
      url.searchParams.set('t', Date.now().toString()); // Add timestamp to force update
      
      // Update the URL without causing a page reload
      window.history.pushState({}, '', url.toString());
      
      // Dispatch a custom event to notify the page of the search result selection
      const customEvent = new CustomEvent('searchResultSelected', {
        detail: { id: result.id, result }
      });
      console.log('Dispatching custom event:', customEvent);
      window.dispatchEvent(customEvent);
      
      // Also trigger a popstate event to ensure useEffect hooks that listen to URL changes are triggered
      console.log('Dispatching popstate event');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } else {
      console.log('Different page navigation');
      // Navigate to different page normally
      router.push(`${result.sectionPath}?id=${result.id}`);
    }
  };

  // Helper functions for search results rendering
  const getResultIcon = (result: SearchResult) => {
    if (result.section === "Contatti") {
      return <User size={14} className="text-blue-500" />;
    } else if (result.section === "Sales Funnel") {
      return <TrendingUp size={14} className="text-orange-500" />;
    } else if (result.section === "Calendario") {
      return <CalendarIcon size={14} className="text-green-500" />;
    } else if (result.section === "Progetti") {
      return <Briefcase size={14} className="text-purple-500" />;
    } else if (result.section === "Chat WhatsApp") {
      return <MessageCircle size={14} className="text-green-600" />;
    } else if (result.section.includes("Banca Dati")) {
      return <Database size={14} className="text-indigo-500" />;
    }
    return <Search size={14} className="text-gray-400" />;
  };

  // Configurazione spring per animazione naturale stile iOS - ottimizzata per l'espansione verso il basso
  const springConfig = {
    type: "spring" as const,
    damping: 30,
    stiffness: 400,
    mass: 0.6,
  };

  // Calcola le coordinate per l'animazione dei risultati di ricerca
  const getSearchAnimationCoordinates = () => {
    if (!searchTriggerRect) {
      return {
        initial: { scale: 0.1, opacity: 0, y: -40, transformOrigin: "top center" },
        animate: { scale: 1, opacity: 1, y: 0, transformOrigin: "top center" }
      };
    }

    // L'animazione parte dal centro della search bar (altezza 0) e si espande verso il basso
    return {
      initial: {
        y: -searchTriggerRect.height / 2, // Parte dal centro verticale della search bar
        scaleY: 0.1,
        scaleX: 0.8,
        opacity: 0,
        transformOrigin: "top center"
      },
      animate: {
        y: 0, // Arriva alla posizione naturale (sotto la search bar)
        scaleY: 1,
        scaleX: 1,
        opacity: 1,
        transformOrigin: "top center"
      }
    };
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
    <>
      <header className="bg-black backdrop-blur-md sticky top-0 z-[60] w-full shadow-lg">
        <div className="relative flex items-center justify-between px-4 py-2.5 md:justify-start">
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
          <div className="relative flex-1 mx-3 md:absolute md:left-1/2 md:transform md:-translate-x-1/2 md:w-full md:max-w-lg md:px-3" ref={searchRef}>
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
                  if (searchResults.length > 0 && searchInputRef.current) {
                    const rect = searchInputRef.current.getBoundingClientRect();
                    setSearchTriggerRect(rect);
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
                    setSearchTriggerRect(null);
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Results Modal con animazione Apple-like */}
      <AnimatePresence mode="wait">
        {showSearchResults && (
          <div 
            className="fixed inset-0 z-50 overflow-hidden"
            onClick={() => {
              setShowSearchResults(false);
              setSearchTriggerRect(null);
            }}
          >
            {/* Background overlay */}
            <motion.div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs backdrop-saturate-150"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={springConfig}
            />
            
            {/* Results container posizionato sotto la search bar */}
            <motion.div 
              className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md mx-4 sm:mx-6"
              style={{
                top: searchTriggerRect ? searchTriggerRect.bottom + 4 : '80px'
              }}
              onClick={(e) => e.stopPropagation()}
              initial={getSearchAnimationCoordinates().initial}
              animate={getSearchAnimationCoordinates().animate}
              exit={{
                y: -40,
                scaleY: 0.1,
                scaleX: 0.8,
                opacity: 0,
                transformOrigin: "top center"
              }}
              transition={springConfig}
            >
              <SmoothCorners 
                corners="2.5"
                borderRadius="24"
              />
              
              <div className="relative bg-white/85 dark:bg-zinc-800/85 backdrop-blur-xs rounded-[24px] shadow-lg overflow-hidden backdrop-saturate-150">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/50 dark:border-zinc-700/50">
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      "{searchQuery}"
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchTriggerRect(null);
                    }}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {/* Results */}
                <div className="py-2">
                  {searchResults.length === 0 ? (
                    <div className="px-5 py-6 text-center text-sm text-zinc-500">
                      {isSearching ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          Ricerca in corso...
                        </div>
                      ) : (
                        'Nessun risultato trovato'
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map((result, index) => (
                        <motion.button
                          key={`${result.section}-${result.id}`}
                          className={`w-full text-left px-5 py-3 transition-colors group ${
                            selectedResultIndex === index 
                              ? 'bg-zinc-100/70 dark:bg-zinc-700/70' 
                              : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                          }`}
                          onClick={() => handleSearchResultClick(result)}
                          onMouseEnter={() => setSelectedResultIndex(index)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Icon */}
                              <div className="flex-shrink-0">
                                {getResultIcon(result)}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-zinc-900 dark:text-white truncate">
                                  {result.name}
                                </div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                  {result.section}
                                </div>
                              </div>
                            </div>
                            
                            {/* Arrow indicator */}
                            <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                                <polyline points="9,18 15,12 9,6"></polyline>
                              </svg>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}