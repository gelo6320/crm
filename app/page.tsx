// app/page.tsx
"use client";

import { useState, useEffect, ReactNode } from "react";
import { 
  Bell, Users, CheckCircle, ArrowRight, RefreshCw, 
  Calendar, Bookmark, FileText, BarChart, ArrowUp, ArrowDown, 
  ChevronRight, Clock, Facebook, LayoutDashboard, 
  TrendingUp, Zap, BadgeCheck, UserPlus,
  LucideIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchDashboardStats, fetchRecentEvents, fetchNewContacts, markContactAsViewed } from "@/lib/api/dashboard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Contact {
  _id: string;
  name: string;
  email: string;
  source: string;
  type: 'form' | 'booking' | 'facebook';
  createdAt: string;
  viewed: boolean;
}

interface Event {
  _id: string;
  eventName: string;
  createdAt: string;
  leadType: string;
  success: boolean;
  error?: string;
}

interface StatsData {
  forms: {
    total: number;
    converted: number;
    conversionRate: number;
    trend: number;
    thisWeek: number;
    lastWeek: number;
  };
  bookings: {
    total: number;
    converted: number;
    conversionRate: number;
    trend: number;
    thisWeek: number;
    lastWeek: number;
  };
  facebook: {
    total: number;
    converted: number;
    conversionRate: number;
    trend: number;
    thisWeek: number;
    lastWeek: number;
  };
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

// Card container props
interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

// Stat Card props
interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number | null;
  bgColor?: string;
  iconColor?: string;
  delay?: number;
}

// Notification Panel props
interface NotificationsPanelProps {
  notifications: Contact[];
  viewedCount: number;
  onViewContact: (contact: Contact) => void;
  onViewAll: () => void;
}

// Card container with animations
const AnimatedCard = ({ children, delay = 0, className = "" }: AnimatedCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: delay * 0.1 }}
    className={`bg-zinc-800/90 backdrop-blur-sm rounded-xl border border-zinc-700/50 shadow-lg ${className}`}
  >
    {children}
  </motion.div>
);

// Stat Card component
const StatCard = ({ title, value, icon: Icon, trend = null, bgColor = "bg-zinc-800/50", iconColor = "text-primary", delay = 0 }: StatCardProps) => {  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className={`${bgColor} rounded-xl p-4 flex flex-col`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`rounded-full p-2 ${iconColor.replace('text-', 'bg-')}/10`}>
          <Icon size={20} className={iconColor} />
        </div>
        {trend !== null && (
          <div className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="font-medium text-zinc-400 text-sm mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </motion.div>
  );
};

// Notifications panel component
function NotificationsPanel({ 
  notifications, 
  viewedCount, 
  onViewContact, 
  onViewAll 
}: NotificationsPanelProps) {
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
      case 'form': return <FileText className="text-emerald-400" />;
      case 'booking': return <Bookmark className="text-emerald-400" />;
      case 'facebook': return <Facebook className="text-emerald-400" />;
      default: return <FileText className="text-emerald-400" />;
    }
  };

  return (
    <AnimatedCard className="overflow-hidden h-full flex flex-col" delay={3}>
      <div className="p-4 border-b border-zinc-700/50 bg-gradient-to-r from-emerald-900/40 to-emerald-700/20 flex justify-between items-center">
        <h2 className="text-base font-semibold flex items-center">
          <Bell size={18} className="mr-2 text-emerald-400" />
          Notifiche
          {viewedCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 bg-emerald-500 text-white text-xs rounded-full px-2 py-0.5"
            >
              {viewedCount} nuovi
            </motion.span>
          )}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent">
        <AnimatePresence>
          {notifications.length > 0 ? (
            <motion.div className="divide-y divide-zinc-800/50">
              {notifications.map((contact, index) => (
                <motion.div 
                  key={contact._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`p-4 hover:bg-zinc-700/20 transition-all cursor-pointer
                    ${!contact.viewed ? 
                      "bg-emerald-900/10 border-l-2 border-emerald-500" : 
                      "hover:border-l-2 hover:border-emerald-500/50"}
                  `}
                  onClick={() => onViewContact(contact)}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-900/60 rounded-full p-2 mt-0.5">
                      {getSourceIcon(contact.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white">{contact.name}</div>
                      <div className="text-sm text-zinc-400 truncate">{contact.email}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-zinc-500 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {getTimeAgo(contact.createdAt)}
                        </div>
                        <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400">
                          {contact.type === 'form' ? 'Form' : 
                           contact.type === 'booking' ? 'Prenotazione' : 'Facebook'}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center text-zinc-500 h-full flex flex-col items-center justify-center"
            >
              <Bell size={30} className="mx-auto mb-3 text-emerald-700 opacity-60" />
              <p className="text-sm">Nessuna notifica</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-3 border-t border-zinc-700/50 bg-emerald-900/10">
        <motion.button 
          onClick={onViewAll}
          className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg border border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300 text-sm font-medium transition-all"
          whileHover={{ scale: 1.02, backgroundColor: "rgba(16, 185, 129, 0.2)" }}
          whileTap={{ scale: 0.98 }}
        >
          <CheckCircle size={16} className="mr-2" />
          Segna tutte come viste
        </motion.button>
      </div>
    </AnimatedCard>
  );
}

// Calculate trends based on previous period
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData>({
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewedCount, setViewedCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  // Function to calculate real trends instead of using mock data
  const processTrendData = (data: StatsData): StatsData => {
    // Calculate trends for each channel
    const processedData = { ...data };
    
    // Calculate form trends based on weeks
    processedData.forms.trend = calculateTrend(data.forms.thisWeek, data.forms.lastWeek);
    
    // Calculate booking trends
    processedData.bookings.trend = calculateTrend(data.bookings.thisWeek, data.bookings.lastWeek);
    
    // Calculate facebook trends
    processedData.facebook.trend = calculateTrend(data.facebook.thisWeek, data.facebook.lastWeek);
    
    // Calculate total trend
    processedData.totalTrend = calculateTrend(data.totalThisWeek, data.totalLastWeek);
    
    return processedData;
  };

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const [statsData, eventsData, newContactsData] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentEvents(),
        fetchNewContacts()
      ]);
      
      // Process trends with real calculations
      const processedStats = processTrendData(statsData as StatsData);
      setStats(processedStats);
      setRecentEvents(eventsData as Event[]);
      
      // Only keep unviewed contacts for notifications
      const unviewedContacts = (newContactsData as Contact[]).filter((contact: Contact) => !contact.viewed);
      setNotifications(unviewedContacts);
      setViewedCount(unviewedContacts.length);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Marks a single contact as viewed and navigates to the corresponding page
  const handleViewContact = async (contact: Contact): Promise<void> => {
    try {
      // Mark as viewed in the backend
      await markContactAsViewed(contact._id);
      
      // Remove this contact from notifications list
      setNotifications(prevNotifications => 
        prevNotifications.filter((item: Contact) => item._id !== contact._id)
      );
      
      // Update the count
      setViewedCount(prev => Math.max(0, prev - 1));
      
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
  const handleViewAllContacts = async (): Promise<void> => {
    try {
      // Mark each contact as viewed
      await Promise.all(
        notifications.map((contact: Contact) => markContactAsViewed(contact._id))
      );
      
      // Clear the notifications list entirely
      setNotifications([]);
      
      // Reset unviewed count
      setViewedCount(0);
    } catch (error) {
      console.error("Error marking all contacts as viewed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoadingSpinner />
        </motion.div>
      </div>
    );
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
    <div className="max-w-full px-0 sm:px-4 py-4 space-y-4 sm:space-y-6">
      {/* Header with refresh button only */}
      <div className="flex justify-end px-4 sm:px-0">
        <motion.button 
          onClick={loadData}
          className="btn flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-700 hover:border-primary hover:bg-primary/10 text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Aggiorna dati"
        >
          <RefreshCw size={16} />
          Aggiorna
        </motion.button>
      </div>
      
      {/* Notifications panel (moved to top) */}
      <div className="w-full md:px-4">
        <NotificationsPanel 
          notifications={notifications} 
          viewedCount={viewedCount}
          onViewContact={handleViewContact}
          onViewAll={handleViewAllContacts}
        />
      </div>
      
      {/* Conversion Overview */}
      <AnimatedCard className="p-4 sm:p-6 md:mx-4" delay={1}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-row items-center text-center md:text-left md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp size={20} className="text-primary" />
              </div>
              <h2 className="text-base font-semibold">Conversione Globale</h2>
            </div>
            <div className="text-4xl font-bold text-primary mb-1">{stats.totalConversionRate}%</div>
            <div className="flex items-center text-sm">
              <span className={`flex items-center ${stats.totalTrend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.totalTrend >= 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
                {Math.abs(stats.totalTrend)}%
              </span>
              <span className="text-zinc-500 ml-2">rispetto alla settimana precedente</span>
            </div>
          </div>
          
          <div className="h-20 w-px bg-zinc-700 hidden md:block"></div>
          
          {/* Conversion funnel */}
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="rounded-xl bg-zinc-800/70 p-4 text-center flex-1 w-full"
            >
              <div className="text-3xl font-bold mb-1">
                {stats.forms.total + stats.bookings.total + stats.facebook.total}
              </div>
              <div className="text-sm text-zinc-400">Lead totali</div>
            </motion.div>
            
            <div className="hidden sm:flex items-center justify-center">
              <motion.div
                animate={{
                  x: [0, 5, 0],
                  transition: { repeat: Infinity, duration: 1.5 }
                }}
              >
                <ArrowRight size={24} className="text-zinc-600" />
              </motion.div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="rounded-xl bg-emerald-900/20 p-4 text-center flex-1 w-full"
            >
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {stats.forms.converted + stats.bookings.converted + stats.facebook.converted}
              </div>
              <div className="text-sm text-zinc-400">Clienti acquisiti</div>
            </motion.div>
          </div>
        </div>
      </AnimatedCard>
      
      {/* Weekly trends */}
      <AnimatedCard className="p-4 sm:p-6 mx-4 sm:mx-0" delay={2}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-blue-500/10">
            <BarChart size={18} className="text-blue-400" />
          </div>
          <h2 className="text-base font-semibold">Andamento Settimanale</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Questa settimana</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{stats.totalThisWeek}</div>
              <div className="text-xs text-zinc-500">nuovi contatti</div>
            </div>
            
            <div className="mt-4 h-2 bg-zinc-700/50 rounded-full">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (stats.totalThisWeek / (stats.totalLastWeek || 1)) * 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-2 bg-primary rounded-full"
              />
            </div>
          </div>
          
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Settimana precedente</div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{stats.totalLastWeek}</div>
              <div className="text-xs text-zinc-500">nuovi contatti</div>
            </div>
            
            <div className="mt-4 h-2 bg-zinc-700/50 rounded-full">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (stats.totalLastWeek / (stats.totalThisWeek || 1)) * 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-2 bg-zinc-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </AnimatedCard>
      
      {/* Recent activity */}
      <AnimatedCard className="overflow-hidden mx-4 sm:mx-0" delay={5}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-700/50 bg-gradient-to-r from-zinc-800 to-zinc-800/50">
          <h2 className="text-base font-semibold flex items-center">
            <Clock size={18} className="mr-2 text-primary" />
            Attività recenti
          </h2>
          <Link href="/events" passHref>
            <motion.div 
              className="p-2 rounded-lg hover:bg-zinc-700/30 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight size={18} />
            </motion.div>
          </Link>
        </div>
        
        <div className="p-4">
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.slice(0, 5).map((event, index) => (
                <motion.div 
                  key={event._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between rounded-lg hover:bg-zinc-800/50 p-3 transition-all"
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${event.success ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                    <div>
                      <div className="font-medium text-sm">{event.eventName}</div>
                      <div className="text-xs text-zinc-400">{event.leadType === 'form' ? 'Form contatto' : 'Prenotazione'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 bg-zinc-800/80 px-2 py-1 rounded-full">
                    {formatDate(event.createdAt)}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              <Clock size={24} className="mx-auto mb-3 text-zinc-600" />
              <p className="text-sm">Nessuna attività recente</p>
            </div>
          )}
        </div>
      </AnimatedCard>
    </div>
  );
}