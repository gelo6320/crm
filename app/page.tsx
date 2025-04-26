"use client";

import { useState, useEffect } from "react";
import { Bell, Users, CheckCircle, ArrowRight, Filter, RefreshCw, 
  Calendar, Bookmark, FileText, BarChart, ArrowUp, ArrowDown, PieChart, 
  ChevronRight, Eye, Clock, Facebook } from "lucide-react";
import Link from "next/link";
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

// Extended Stats type
interface SourceStats {
  total: number;
  converted: number;
  conversionRate: number;
  trend: number;
  thisWeek: number;
  lastWeek: number;
}

interface Stats {
  forms: SourceStats;
  bookings: SourceStats;
  facebook: SourceStats;
  events: {
    total: number;
    success: number;
    successRate: number;
  };
  totalConversionRate: number;
  totalTrend: number;
  totalThisWeek: number;
  totalLastWeek: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
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

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [statsData, eventsData, newContactsData] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentEvents(),
        fetchNewContacts() // API function to get unviewed contacts
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
  
  const markAsViewed = async (contactId: string) => {
    try {
      // Call API to mark contact as viewed
      await markContactAsViewed(contactId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(contact =>
          contact._id === contactId ? { ...contact, viewed: true } : contact
        )
      );
      setViewedCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking contact as viewed:", error);
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
  
  // Get time ago
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
      case 'form': return <FileText size={16} className="text-primary" />;
      case 'booking': return <Bookmark size={16} className="text-success" />;
      case 'facebook': return <Facebook size={16} className="text-blue-500" />;
      default: return <FileText size={16} className="text-primary" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with notifications count */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium flex items-center">
          <BarChart size={20} className="mr-2 text-primary" />
          Dashboard
        </h1>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button className="btn btn-outline inline-flex items-center justify-center p-2">
              <Bell size={18} />
              {viewedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {viewedCount}
                </span>
              )}
            </button>
          </div>
          
          <button 
            onClick={loadData}
            className="btn btn-outline p-1.5"
            title="Aggiorna dati"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      
      {/* Total contacts trend card */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-medium">Andamento Contatti</h2>
          
          <div className={`${stats.totalTrend > 0 ? 'text-success' : 'text-danger'} flex items-center text-sm font-medium`}>
            {stats.totalTrend > 0 ? <ArrowUp size={18} className="mr-1" /> : <ArrowDown size={18} className="mr-1" />}
            {Math.abs(stats.totalTrend)}% rispetto alla settimana precedente
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Questa settimana</div>
            <div className="text-2xl font-bold">{stats.totalThisWeek}</div>
            <div className="text-xs text-zinc-500 mt-1">nuovi contatti</div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <div className="text-sm text-zinc-400 mb-1">Settimana precedente</div>
            <div className="text-2xl font-bold">{stats.totalLastWeek}</div>
            <div className="text-xs text-zinc-500 mt-1">nuovi contatti</div>
          </div>
        </div>
      </div>
      
      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column - Notifications panel */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-base font-medium flex items-center">
                <Bell size={16} className="mr-2 text-primary" />
                Notifiche
                {viewedCount > 0 && (
                  <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                    {viewedCount} nuovi
                  </span>
                )}
              </h2>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {notifications.map((contact) => (
                    <div key={contact._id} className={`p-3 hover:bg-zinc-800/30 transition-colors
                      ${!contact.viewed ? "bg-zinc-800/50 border-l-2 border-primary" : ""}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-2">
                          <div className="bg-zinc-800 rounded-full p-1.5 mt-0.5">
                            {getSourceIcon(contact.type)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{contact.name}</div>
                            <div className="text-sm text-zinc-400">{contact.email}</div>
                            <div className="flex items-center text-xs text-zinc-500 mt-1">
                              <Clock size={12} className="mr-1" />
                              {getTimeAgo(contact.createdAt)}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => markAsViewed(contact._id)}
                          className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                          title="Segna come visto"
                        >
                          {contact.viewed ? <CheckCircle size={16} className="text-success" /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <Bell size={24} className="mx-auto mb-2 text-zinc-600" />
                  <p>Nessuna notifica</p>
                </div>
              )}
            </div>
            
            <div className="p-3 border-t border-zinc-700 bg-zinc-900/50">
              <Link href="/contacts" className="btn btn-outline btn-sm w-full inline-flex items-center justify-center">
                <Users size={14} className="mr-1.5" />
                Visualizza tutti i contatti
              </Link>
            </div>
          </div>
        </div>
        
        {/* Right column - Metrics */}
        <div className="lg:col-span-2">
          {/* Conversion rate overview */}
          <div className="card mb-4">
            <div className="p-4 border-b border-zinc-700">
              <h2 className="text-base font-medium">Tasso di conversione complessivo</h2>
            </div>
            
            <div className="p-5 flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">{stats.totalConversionRate}%</div>
                <div className="text-sm text-zinc-400 mt-1">Tasso di conversione globale</div>
              </div>
              
              <div className="h-20 w-1 bg-zinc-800 mx-6"></div>
              
              {/* Conversion funnel */}
              <div className="flex-1 grid grid-cols-3 gap-2">
                <div className="bg-zinc-800/50 rounded p-2 text-center">
                  <div className="text-2xl font-semibold">{stats.forms.total + stats.bookings.total + stats.facebook.total}</div>
                  <div className="text-xs text-zinc-400">Lead totali</div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight size={20} className="text-zinc-600" />
                </div>
                <div className="bg-zinc-800/50 rounded p-2 text-center">
                  <div className="text-2xl font-semibold text-success">{stats.forms.converted + stats.bookings.converted + stats.facebook.converted}</div>
                  <div className="text-xs text-zinc-400">Clienti acquisiti</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Source stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="card p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="bg-primary/20 text-primary p-2 rounded-lg mr-3">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400">Form</div>
                    <div className="text-xl font-semibold">{stats.forms.thisWeek}</div>
                    <div className="text-xs text-zinc-500">questa settimana</div>
                  </div>
                </div>
                <div className={`${stats.forms.trend > 0 ? 'text-success' : 'text-danger'} flex items-center`}>
                  {stats.forms.trend > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  <span className="text-xs ml-0.5">{Math.abs(stats.forms.trend)}%</span>
                </div>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Conversione: {stats.forms.conversionRate}%</div>
            </div>
            
            <div className="card p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="bg-success/20 text-success p-2 rounded-lg mr-3">
                    <Bookmark size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400">Prenotazioni</div>
                    <div className="text-xl font-semibold">{stats.bookings.thisWeek}</div>
                    <div className="text-xs text-zinc-500">questa settimana</div>
                  </div>
                </div>
                <div className={`${stats.bookings.trend > 0 ? 'text-success' : 'text-danger'} flex items-center`}>
                  {stats.bookings.trend > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  <span className="text-xs ml-0.5">{Math.abs(stats.bookings.trend)}%</span>
                </div>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Conversione: {stats.bookings.conversionRate}%</div>
            </div>
            
            <div className="card p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <div className="bg-blue-500/20 text-blue-500 p-2 rounded-lg mr-3">
                    <Facebook size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400">Facebook</div>
                    <div className="text-xl font-semibold">{stats.facebook.thisWeek}</div>
                    <div className="text-xs text-zinc-500">questa settimana</div>
                  </div>
                </div>
                <div className={`${stats.facebook.trend > 0 ? 'text-success' : 'text-danger'} flex items-center`}>
                  {stats.facebook.trend > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  <span className="text-xs ml-0.5">{Math.abs(stats.facebook.trend)}%</span>
                </div>
              </div>
              <div className="text-xs text-zinc-500 mt-1">Conversione: {stats.facebook.conversionRate}%</div>
            </div>
          </div>
          
          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/forms" className="card p-4 hover:border-primary transition-colors group">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                  <FileText size={18} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm">Form</div>
                  <div className="text-xs text-zinc-400">{stats.forms.total} contatti</div>
                </div>
              </div>
            </Link>
            
            <Link href="/bookings" className="card p-4 hover:border-primary transition-colors group">
              <div className="flex items-center">
                <div className="bg-success/10 p-2 rounded-lg mr-3 group-hover:bg-success/20 transition-colors">
                  <Bookmark size={18} className="text-success" />
                </div>
                <div>
                  <div className="text-sm">Prenotazioni</div>
                  <div className="text-xs text-zinc-400">{stats.bookings.total} contatti</div>
                </div>
              </div>
            </Link>
            
            <Link href="/facebook-leads" className="card p-4 hover:border-primary transition-colors group">
              <div className="flex items-center">
                <div className="bg-blue-500/10 p-2 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors">
                  <Facebook size={18} className="text-blue-500" />
                </div>
                <div>
                  <div className="text-sm">Facebook</div>
                  <div className="text-xs text-zinc-400">{stats.facebook.total} contatti</div>
                </div>
              </div>
            </Link>
            
            <Link href="/calendar" className="card p-4 hover:border-primary transition-colors group">
              <div className="flex items-center">
                <div className="bg-zinc-700/50 p-2 rounded-lg mr-3 group-hover:bg-zinc-700 transition-colors">
                  <Calendar size={18} className="text-zinc-300" />
                </div>
                <div>
                  <div className="text-sm">Calendario</div>
                  <div className="text-xs text-zinc-400">Visualizza</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-base font-medium flex items-center">
            <Clock size={16} className="mr-2 text-primary" />
            Attività recenti
          </h2>
          <Link href="/events" className="btn btn-outline btn-sm p-1.5">
            <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="p-4">
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center justify-between hover:bg-zinc-800/30 p-2 rounded transition-colors">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${event.success ? 'bg-success' : 'bg-danger'} mr-3`}></div>
                    <div>
                      <div className="font-medium text-sm">{event.eventName}</div>
                      <div className="text-xs text-zinc-400">{event.leadType === 'form' ? 'Form contatto' : 'Prenotazione'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500">{formatDate(event.createdAt)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-zinc-500">
              <Clock size={24} className="mx-auto mb-2 text-zinc-600" />
              <p>Nessuna attività recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}