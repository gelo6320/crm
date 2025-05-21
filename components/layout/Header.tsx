// components/layout/Header.tsx
"use client";

import { Bell, Menu, Search, User, X, Loader2, Calendar as CalendarIcon, Users, Briefcase } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";

// Define the SearchResult type for suggestions
interface SearchResult {
  id: string;
  name: string;
  email?: string;
  section: string;
  sectionPath: string;
  type?: string;
}

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
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
      const response = await axios.get(`/api/global-search?query=${encodeURIComponent(searchQuery)}&limit=10`);
      
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
        
        {/* Right section with notifications and user menu */}
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