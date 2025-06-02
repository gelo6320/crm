// components/layout/Header.tsx
"use client";

import { Bell, Menu, Search, User, X, Loader2, Calendar as CalendarIcon, Users, Briefcase, UserCog, RotateCcw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { getUsers, switchUser, restoreAdmin, checkAuth } from "@/lib/api/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Define the SearchResult type for suggestions
interface SearchResult {
  id: string;
  name: string;
  email?: string;
  section: string;
  sectionPath: string;
  type?: string;
  // Aggiungi le proprietà mancanti
  start?: string; // Per gli eventi del calendario
  client?: string; // Per i progetti
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
  
  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
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
      default:
        return "Dashboard";
    }
  };
  
  return (
    <header className="bg-black border-b border-zinc-800 sticky top-0 z-50 w-full shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5">
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
            {isAdmin && (
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
                  <div className="absolute right-0 mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-50">
                    <div className="p-3 border-b border-zinc-700">
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
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors ${
                                currentUser?.username === user.username
                                  ? 'bg-zinc-700 text-white'
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
            <Link href="/" className="flex items-center space-x-2 text-white hover:text-primary transition">
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
            <div className="h-6 w-px bg-zinc-700 hidden md:block"></div>
            
            <span className="font-semibold text-sm md:text-base">
              {getHeaderTitle()}
            </span>
          </div>
        </div>
        
        {/* Center section with enhanced search */}
        <div className="relative flex-1 max-w-md mx-3" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              {isSearching ? (
                <Loader2 size={16} className="text-zinc-500 animate-spin" />
              ) : (
                <Search size={16} className="text-zinc-500" />
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
              className="bg-zinc-900 border border-zinc-700 text-white text-xs rounded-full w-full py-1.5 pl-8 pr-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Cerca contatti, eventi..."
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
            <div className="absolute z-50 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-80 overflow-auto">
              {searchResults.length === 0 ? (
                <div className="py-2 px-3 text-sm text-zinc-400">
                  {isSearching ? 'Ricerca in corso...' : 'Nessun risultato trovato'}
                </div>
              ) : (
                <div>
                  <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-700">
                    {searchResults.length} risultati trovati per "{searchQuery}"
                  </div>
                  <ul className="divide-y divide-zinc-700/50">
                    {searchResults.map((result, index) => (
                      <li 
                        key={`${result.section}-${result.id}`}
                        id={`search-result-${index}`}
                        className={`cursor-pointer p-3 text-sm transition-colors ${
                          selectedResultIndex === index 
                            ? 'bg-zinc-700' 
                            : 'hover:bg-zinc-700/70'
                        }`}
                        onClick={() => handleSearchResultClick(result)}
                        onMouseEnter={() => setSelectedResultIndex(index)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{result.name}</div>
                          <div className="text-xs text-zinc-400 px-2 py-0.5 bg-zinc-700 rounded-full flex items-center gap-1">
                            {result.section === "Contatti" && (
                              <User size={10} className="text-primary" />
                            )}
                            {result.section === "Calendario" && (
                              <CalendarIcon size={10} className="text-blue-400" />
                            )}
                            {result.section === "Progetti" && (
                              <Briefcase size={10} className="text-green-400" />
                            )}
                            <span>{result.section}</span>
                          </div>
                        </div>
                        
                        <div className="mt-1">
                          {result.email && (
                            <div className="text-xs text-primary truncate">{result.email}</div>
                          )}
                          
                          {result.section === "Calendario" && result.start && (
                            <div className="text-xs text-zinc-400 flex items-center">
                              <CalendarIcon size={10} className="mr-1" /> 
                              {new Date(result.start).toLocaleDateString('it-IT')}
                            </div>
                          )}
                          
                          {result.section === "Progetti" && result.client && (
                            <div className="text-xs text-zinc-400 flex items-center">
                              <Users size={10} className="mr-1" /> 
                              {result.client}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
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