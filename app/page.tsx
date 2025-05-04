// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Users, CheckCircle, ArrowRight, Filter, RefreshCw, 
  Calendar, Bookmark, FileText, BarChart, ArrowUp, ArrowDown, PieChart, 
  ChevronRight, Clock, Facebook } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchDashboardStats, fetchRecentEvents, fetchNewContacts, markContactAsViewed } from "@/lib/api/dashboard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Type for notifications
interface Contact {
  _id: string;
  name: string;
  email: string;
  source: string;
  type: 'form' | 'booking' | 'facebook';
  createdAt: string;
  viewed: boolean;
}

// Type for events
interface Event {
  _id: string;
  eventName: string;
  createdAt: string;
  leadType: string;
  success: boolean;
  error?: string;
}

// Modified notifications panel component
function NotificationsPanel({ 
  notifications, 
  viewedCount, 
  onViewContact, 
  onViewAll,
  isMobile = false
}: { 
  notifications: Contact[];
  viewedCount: number;
  onViewContact: (contact: Contact) => void;
  onViewAll: () => void;
  isMobile?: boolean;
}) {
  // Format time ago
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min fa`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)} ore fa`;
    } else {
      return `${Math.floor(diffInMinutes / (60 * 24))} giorni fa`;
    }
  };
  
  // Source icon mapping
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'form': return <FileText size={isMobile ? 14 : 16} className="text-emerald-400" />;
      case 'booking': return <Bookmark size={isMobile ? 14 : 16} className="text-emerald-400" />;
      case 'facebook': return <Facebook size={isMobile ? 14 : 16} className="text-emerald-400" />;
      default: return <FileText size={isMobile ? 14 : 16} className="text-emerald-400" />;
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-2 sm:p-4 border-b border-zinc-700 bg-gradient-to-r from-emerald-900/40 to-emerald-700/20 flex justify-between items-center">
        <h2 className="text-sm sm:text-base font-medium flex items-center">
          <Bell size={isMobile ? 14 : 16} className="mr-1.5 sm:mr-2 text-emerald-400" />
          Notifiche
          {viewedCount > 0 && (
            <span className="ml-1.5 sm:ml-2 bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs">
              {viewedCount} nuovi
            </span>
          )}
        </h2>
      </div>
      
      <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-zinc-900">
        {notifications.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {notifications.map((contact) => (
              <div 
                key={contact._id} 
                className={`p-2 sm:p-3 hover:bg-zinc-800/30 transition-colors cursor-pointer
                  ${!contact.viewed ? 
                    "bg-emerald-900/10 border-l-2 border-emerald-500" : 
                    "hover:border-l-2 hover:border-emerald-500/50"}
                `}
                onClick={() => onViewContact(contact)}
              >
                <div className="flex items-start space-x-1.5 sm:space-x-2">
                  <div className="bg-emerald-900/60 rounded-full p-1 sm:p-1.5 mt-0.5">
                    {getSourceIcon(contact.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs sm:text-sm">{contact.name}</div>
                    <div className="text-xs sm:text-sm text-zinc-400 truncate">{contact.email}</div>
                    <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                      <div className="text-[10px] sm:text-xs text-zinc-500 flex items-center">
                        <Clock size={isMobile ? 10 : 12} className="mr-0.5 sm:mr-1" />
                        {getTimeAgo(contact.createdAt)}
                      </div>
                      <div className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400">
                        {contact.type === 'form' ? 'Form' : 
                         contact.type === 'booking' ? 'Prenotazione' : 'Facebook'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 sm:p-8 text-center text-zinc-500">
            <Bell size={isMobile ? 20 : 24} className="mx-auto mb-2 text-emerald-700" />
            <p className="text-sm">Nessuna notifica</p>
          </div>
        )}
      </div>
      
      <div className="p-2 sm:p-3 border-t border-zinc-700 bg-emerald-900/10">
        <button 
          onClick={onViewAll}
          className="btn btn-outline w-full inline-flex items-center justify-center border-emerald-600 text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300 text-xs sm:text-sm py-1 sm:py-1.5"
        >
          <CheckCircle size={isMobile ? 12 : 14} className="mr-1 sm:mr-1.5" />
          Segna tutte come viste
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    forms: { total: 0, converted: 0, conversionRate: 0, trend: 0, thisWeek: 0, lastWeek: 0 },
    bookings: { total: 0, converted: 0, conversionRate: 0, trend: 0, thisWeek: 0, lastWeek: 0 },
    facebook: { total: 0, converted: 0, conversionRate: 0, trend: 0, thisWeek: 0, lastWeek: 0 },
    events: { total: 0, success: 0, successRate: 0 },
    totalConversionRate: 0,
    totalTrend: 0,
    totalThisWeek: 0,
    totalLastWeek: 0
  });
  
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewedCount, setViewedCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [statsData, eventsData, newContactsData] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentEvents(),
        fetchNewContacts()
      ]);
      
      setStats(statsData);
      setRecentEvents(eventsData);
      setNotifications(newContactsData);
      setViewedCount(newContactsData.filter((contact: Contact) => !contact.viewed).length);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Marks a single contact as viewed and navigates to the corresponding page
  const handleViewContact = async (contact: Contact) => {
    try {
      // Mark as viewed in the backend
      await markContactAsViewed(contact._id);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(item =>
          item._id === contact._id ? { ...item, viewed: true } : item
        )
      );
      
      // Update the unviewed count
      if (!contact.viewed) {
        setViewedCount(prev => Math.max(0, prev - 1));
      }
      
      // Navigate to the appropriate page based on contact type
      switch (contact.type) {
        case 'form':
          router.push(`/forms?id=${contact._id}`);
          break;
        case 'booking':
          router.push(`/bookings?id=${contact._id}`);
          break;
        case 'facebook':
          router.push(`/facebook-leads?id=${contact._id}`);
          break;
        default:
          router.push('/contacts');
      }
    } catch (error) {
      console.error("Error marking contact as viewed:", error);
    }
  };
  
  // Marks all contacts as viewed
  const handleViewAllContacts = async () => {
    try {
      // Get only unviewed contacts
      const unviewedContacts = notifications.filter(contact => !contact.viewed);
      
      // Mark each contact as viewed
      await Promise.all(
        unviewedContacts.map(contact => markContactAsViewed(contact._id))
      );
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(contact => ({ ...contact, viewed: true }))
      );
      
      // Reset unviewed count
      setViewedCount(0);
    } catch (error) {
      console.error("Error marking all contacts as viewed:", error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-3 sm:space-y-6 animate-fade-in">
      {/* Header with notifications count */}
      <div className="flex items-center justify-end mb-2 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button 
            onClick={loadData}
            className="btn btn-outline p-1 sm:p-1.5"
            title="Aggiorna dati"
          >
            <RefreshCw size={isMobile ? 14 : 16} />
          </button>
        </div>
      </div>
      
      {/* Total contacts trend card */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <h2 className="text-sm sm:text-base font-medium">Andamento Contatti</h2>
          
          <div className={`${stats.totalTrend > 0 ? 'text-success' : 'text-danger'} flex items-center text-xs sm:text-sm font-medium`}>
            {stats.totalTrend > 0 ? <ArrowUp size={isMobile ? 14 : 18} className="mr-0.5 sm:mr-1" /> : <ArrowDown size={isMobile ? 14 : 18} className="mr-0.5 sm:mr-1" />}
            {Math.abs(stats.totalTrend)}% rispetto alla settimana precedente
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-4">
          <div className="bg-zinc-800/50 rounded-lg p-2 sm:p-4">
            <div className="text-xs sm:text-sm text-zinc-400 mb-0.5 sm:mb-1">Questa settimana</div>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalThisWeek}</div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 sm:mt-1">nuovi contatti</div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-lg p-2 sm:p-4">
            <div className="text-xs sm:text-sm text-zinc-400 mb-0.5 sm:mb-1">Settimana precedente</div>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalLastWeek}</div>
            <div className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 sm:mt-1">nuovi contatti</div>
          </div>
        </div>
      </div>
      
      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Left column - Notifications panel */}
        <div className="lg:col-span-1">
          <NotificationsPanel 
            notifications={notifications} 
            viewedCount={viewedCount}
            onViewContact={handleViewContact}
            onViewAll={handleViewAllContacts}
            isMobile={isMobile}
          />
        </div>
        
        {/* Right column - Metrics */}
        <div className="lg:col-span-2">
          {/* Conversion rate overview */}
          <div className="card mb-3 sm:mb-4">
            <div className="p-2 sm:p-4 border-b border-zinc-700">
              <h2 className="text-sm sm:text-base font-medium">Tasso di conversione complessivo</h2>
            </div>
            
            <div className="p-3 sm:p-5 flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="text-xl sm:text-3xl font-bold text-primary">{stats.totalConversionRate}%</div>
                <div className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">Tasso di conversione globale</div>
              </div>
              
              <div className="h-16 sm:h-20 w-1 bg-zinc-800 mx-2 sm:mx-6"></div>
              
              {/* Conversion funnel */}
              <div className="flex-1 grid grid-cols-3 gap-1 sm:gap-2">
                <div className="bg-zinc-800/50 rounded p-1 sm:p-2 text-center">
                  <div className="text-base sm:text-2xl font-semibold">{stats.forms.total + stats.bookings.total + stats.facebook.total}</div>
                  <div className="text-[10px] sm:text-xs text-zinc-400">Lead totali</div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight size={isMobile ? 16 : 20} className="text-zinc-600" />
                </div>
                <div className="bg-zinc-800/50 rounded p-1 sm:p-2 text-center">
                  <div className="text-base sm:text-2xl font-semibold text-success">{stats.forms.converted + stats.bookings.converted + stats.facebook.converted}</div>
                  <div className="text-[10px] sm:text-xs text-zinc-400">Clienti acquisiti</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <Link href="/forms" className="card p-2 sm:p-4 hover:border-primary transition-colors group">
              <div className="flex items-center">
                <div className="bg-primary/10 p-1 sm:p-2 rounded-lg mr-2 sm:mr-3 group-hover:bg-primary/20 transition-colors">
                  <FileText size={isMobile ? 14 : 18} className="text-primary" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm">Form</div>
                  <div className="text-[10px] sm:text-xs text-zinc-400">{stats.forms.total} contatti</div>
                </div>
              </div>
            </Link>
            
            <Link href="/bookings" className="card p-2 sm:p-4 hover:border-primary transition-colors group">
              <div className="flex items-center">
                <div className="bg-success/10 p-1 sm:p-2 rounded-lg mr-2 sm:mr-3 group-hover:bg-success/20 transition-colors">
                  <Bookmark size={isMobile ? 14 : 18} className="text-success" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm">Prenotazioni</div>
                  <div className="text-[10px] sm:text-xs text-zinc-400">{stats.bookings.total} contatti</div>
                </div>
              </div>
            </Link>
            
            <Link href="/facebook-leads" className="card p-2 sm:p-4 hover:border-primary transition-colors group">
              <div className="flex items-center">
                <div className="bg-blue-500/10 p-1 sm:p-2 rounded-lg mr-2 sm:mr-3 group-hover:bg-blue-500/20 transition-colors">
                  <Facebook size={isMobile ? 14 : 18} className="text-blue-500" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm">Facebook</div>
                  <div className="text-[10px] sm:text-xs text-zinc-400">{stats.facebook.total} contatti</div>
                </div>
              </div>
            </Link>
            
            <Link href="/calendar" className="card p-2 sm:p-4 hover:border-primary transition-colors group">
              <div className="flex items-center">
                <div className="bg-zinc-700/50 p-1 sm:p-2 rounded-lg mr-2 sm:mr-3 group-hover:bg-zinc-700 transition-colors">
                  <Calendar size={isMobile ? 14 : 18} className="text-zinc-300" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm">Calendario</div>
                  <div className="text-[10px] sm:text-xs text-zinc-400">Visualizza</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between p-2 sm:p-4 border-b border-zinc-700">
          <h2 className="text-sm sm:text-base font-medium flex items-center">
            <Clock size={isMobile ? 14 : 16} className="mr-1.5 sm:mr-2 text-primary" />
            Attività recenti
          </h2>
          <Link href="/events" className="btn btn-outline btn-sm p-1 sm:p-1.5">
            <ChevronRight size={isMobile ? 14 : 16} />
          </Link>
        </div>
        
        <div className="p-2 sm:p-4">
          {recentEvents.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center justify-between hover:bg-zinc-800/30 p-1.5 sm:p-2 rounded transition-colors">
                  <div className="flex items-center">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${event.success ? 'bg-success' : 'bg-danger'} mr-2 sm:mr-3`}></div>
                    <div>
                      <div className="font-medium text-xs sm:text-sm">{event.eventName}</div>
                      <div className="text-[10px] sm:text-xs text-zinc-400">{event.leadType === 'form' ? 'Form contatto' : 'Prenotazione'}</div>
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-500">{formatDate(event.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 sm:p-6 text-center text-zinc-500">
              <Clock size={isMobile ? 20 : 24} className="mx-auto mb-2 text-zinc-600" />
              <p className="text-sm">Nessuna attività recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}