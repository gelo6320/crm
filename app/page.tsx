// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Filter, 
  RefreshCw, 
  Calendar, 
  Bookmark, 
  FileText, 
  BarChart, 
  ArrowUp, 
  ArrowDown, 
  PieChart, 
  ChevronRight, 
  Clock, 
  Facebook,
  Briefcase,
  TrendingUp 
} from "lucide-react";
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

// Stats interface
interface Stats {
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

// NotificationsPanel props interface
interface NotificationsPanelProps {
  notifications: Contact[];
  viewedCount: number;
  onViewContact: (contact: Contact) => void;
  onViewAll: () => void;
  isMobile?: boolean;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const cardVariants = {
  hover: {
    y: -5,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 } 
  }
};

// Modified notifications panel component
function NotificationsPanel({ 
  notifications, 
  viewedCount, 
  onViewContact, 
  onViewAll,
  isMobile = false
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
      case 'form': return <FileText size={isMobile ? 14 : 16} className="text-blue-400" />;
      case 'booking': return <Bookmark size={isMobile ? 14 : 16} className="text-purple-400" />;
      case 'facebook': return <Facebook size={isMobile ? 14 : 16} className="text-indigo-400" />;
      default: return <FileText size={isMobile ? 14 : 16} className="text-blue-400" />;
    }
  };

  const getSourceGradient = (type: string): string => {
    switch (type) {
      case 'form': return 'from-blue-900/20 to-blue-700/10';
      case 'booking': return 'from-purple-900/20 to-purple-700/10';
      case 'facebook': return 'from-indigo-900/20 to-indigo-700/10';
      default: return 'from-blue-900/20 to-blue-700/10';
    }
  };

  const getSourceColor = (type: string): string => {
    switch (type) {
      case 'form': return 'border-blue-500 bg-blue-900/10';
      case 'booking': return 'border-purple-500 bg-purple-900/10';
      case 'facebook': return 'border-indigo-500 bg-indigo-900/10';
      default: return 'border-blue-500 bg-blue-900/10';
    }
  };

  const getSourceName = (type: string): string => {
    switch (type) {
      case 'form': return 'Form';
      case 'booking': return 'Prenotazione';
      case 'facebook': return 'Facebook';
      default: return type;
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      custom={1}
      className="bg-zinc-800/70 rounded-xl border border-zinc-700/50 shadow-lg backdrop-blur-sm overflow-hidden"
    >
      <div className="p-4 border-b border-zinc-700/50 bg-gradient-to-r from-zinc-800 to-zinc-800/70 flex justify-between items-center">
        <h2 className="text-base font-medium flex items-center">
          <Bell size={18} className="mr-2 text-blue-400" />
          Notifiche
          {viewedCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5"
            >
              {viewedCount} nuovi
            </motion.span>
          )}
        </h2>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-zinc-800/50">
            <AnimatePresence>
              {notifications.map((contact: Contact, index: number) => (
                <motion.div 
                  key={contact._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 cursor-pointer
                    ${!contact.viewed ? 
                      `${getSourceColor(contact.type)} border-l-2` : 
                      "hover:border-l-2 hover:border-zinc-500/50"}
                  `}
                  onClick={() => onViewContact(contact)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`bg-gradient-to-br ${getSourceGradient(contact.type)} rounded-full p-2 mt-0.5 shadow-sm`}>
                      {getSourceIcon(contact.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white">{contact.name}</div>
                      <div className="text-sm text-zinc-300 truncate">{contact.email}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-zinc-400 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {getTimeAgo(contact.createdAt)}
                        </div>
                        <div className="text-xs px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 backdrop-blur-sm">
                          {getSourceName(contact.type)}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 text-center text-zinc-400"
          >
            <Bell size={24} className="mx-auto mb-2 text-zinc-500" />
            <p className="text-sm">Nessuna notifica</p>
          </motion.div>
        )}
      </div>
      
      <div className="p-3 border-t border-zinc-700/50 bg-zinc-800/70">
        <motion.button 
          whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}
          whileTap={{ scale: 0.97 }}
          onClick={onViewAll}
          className="w-full inline-flex items-center justify-center py-2 px-4 rounded-lg bg-zinc-700/30 text-blue-400 border border-zinc-700/50 text-sm shadow-sm backdrop-blur-sm transition-colors"
        >
          <CheckCircle size={14} className="mr-1.5" />
          Segna tutte come viste
        </motion.button>
      </div>
    </motion.div>
  );
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewedCount, setViewedCount] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
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
      
      // Calculate trends based on real data
      const processedStats = processStatsData(statsData);
      
      setStats(processedStats);
      setRecentEvents(eventsData as Event[]);
      
      // Only keep unviewed contacts for notifications
      const unviewedContacts = (newContactsData as Contact[]).filter(contact => !contact.viewed);
      setNotifications(unviewedContacts);
      setViewedCount(unviewedContacts.length);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process and calculate trends based on real data
  const processStatsData = (statsData: Stats): Stats => {
    // Calculate form trend
    const formTrend = statsData.forms.lastWeek > 0 
      ? Math.round(((statsData.forms.thisWeek - statsData.forms.lastWeek) / statsData.forms.lastWeek) * 100) 
      : 0;
    
    // Calculate booking trend
    const bookingTrend = statsData.bookings.lastWeek > 0 
      ? Math.round(((statsData.bookings.thisWeek - statsData.bookings.lastWeek) / statsData.bookings.lastWeek) * 100) 
      : 0;
    
    // Calculate facebook trend
    const facebookTrend = statsData.facebook.lastWeek > 0 
      ? Math.round(((statsData.facebook.thisWeek - statsData.facebook.lastWeek) / statsData.facebook.lastWeek) * 100) 
      : 0;
    
    // Calculate total trend
    const totalLastWeek = statsData.forms.lastWeek + statsData.bookings.lastWeek + statsData.facebook.lastWeek;
    const totalThisWeek = statsData.forms.thisWeek + statsData.bookings.thisWeek + statsData.facebook.thisWeek;
    const totalTrend = totalLastWeek > 0 
      ? Math.round(((totalThisWeek - totalLastWeek) / totalLastWeek) * 100) 
      : 0;
    
    return {
      ...statsData,
      forms: { ...statsData.forms, trend: formTrend },
      bookings: { ...statsData.bookings, trend: bookingTrend },
      facebook: { ...statsData.facebook, trend: facebookTrend },
      totalTrend,
      totalThisWeek,
      totalLastWeek
    };
  };
  
  // Marks a single contact as viewed and navigates to the corresponding page
  const handleViewContact = async (contact: Contact) => {
    try {
      // Mark as viewed in the backend
      await markContactAsViewed(contact._id);
      
      // Remove this contact from notifications list
      setNotifications(prevNotifications => 
        prevNotifications.filter(item => item._id !== contact._id)
      );
      
      // Update the count (should be one less now)
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
  const handleViewAllContacts = async () => {
    try {
      // Mark each contact as viewed
      await Promise.all(
        notifications.map(contact => markContactAsViewed(contact._id))
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
        <LoadingSpinner />
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="px-4 md:px-6 py-6 md:py-8 space-y-6"
    >
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-semibold text-white">Dashboard</h1>
        <motion.button 
          whileHover={{ rotate: 180, backgroundColor: "rgba(255,255,255,0.1)" }}
          transition={{ duration: 0.3 }}
          onClick={loadData}
          className="p-2 rounded-full bg-zinc-800/70 text-zinc-300 border border-zinc-700/50 shadow-sm"
          title="Aggiorna dati"
        >
          <RefreshCw size={isMobile ? 16 : 18} />
        </motion.button>
      </div>
      
      {/* Total contacts trend card */}
      <motion.div 
        variants={fadeIn}
        custom={0}
        initial="hidden"
        animate="visible"
        className="bg-gradient-to-br from-zinc-800/70 to-zinc-900/50 rounded-xl border border-zinc-700/50 shadow-lg p-5 backdrop-blur-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div className="flex items-center space-x-2 mb-2 md:mb-0">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp size={isMobile ? 18 : 22} className="text-blue-400" />
            </div>
            <h2 className="text-lg md:text-xl font-medium text-white">Andamento Contatti</h2>
          </div>
          
          <div className={`${stats.totalTrend >= 0 ? 'text-emerald-400' : 'text-rose-400'} flex items-center text-sm font-medium`}>
            {stats.totalTrend >= 0 ? 
              <ArrowUp size={18} className="mr-1" /> : 
              <ArrowDown size={18} className="mr-1" />
            }
            <span>{Math.abs(stats.totalTrend)}% rispetto alla settimana precedente</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            whileHover="hover"
            whileTap="tap"
            variants={cardVariants}
            className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50 shadow-md"
          >
            <div className="text-sm text-zinc-300 mb-1">Questa settimana</div>
            <div className="text-2xl md:text-3xl font-bold text-white">{stats.totalThisWeek}</div>
            <div className="text-xs text-zinc-400 mt-1">nuovi contatti</div>
          </motion.div>
          
          <motion.div 
            whileHover="hover"
            whileTap="tap"
            variants={cardVariants}
            className="bg-zinc-800/60 rounded-xl p-4 border border-zinc-700/50 shadow-md"
          >
            <div className="text-sm text-zinc-300 mb-1">Settimana precedente</div>
            <div className="text-2xl md:text-3xl font-bold text-white">{stats.totalLastWeek}</div>
            <div className="text-xs text-zinc-400 mt-1">nuovi contatti</div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        <div className="lg:col-span-2 space-y-6">
          {/* Conversion rate overview */}
          <motion.div 
            variants={fadeIn}
            custom={2}
            initial="hidden"
            animate="visible"
            className="bg-gradient-to-br from-zinc-800/70 to-zinc-900/50 rounded-xl border border-zinc-700/50 shadow-lg backdrop-blur-sm overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-700/50">
              <h2 className="text-base font-medium text-white">Tasso di conversione complessivo</h2>
            </div>
            
            <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex flex-col items-center mb-4 md:mb-0">
                <div className="text-3xl font-bold text-blue-400">{stats.totalConversionRate}%</div>
                <div className="text-sm text-zinc-300 mt-1">Tasso di conversione globale</div>
              </div>
              
              <div className="hidden md:block h-20 w-1 bg-zinc-700/50 mx-6"></div>
              
              {/* Conversion funnel */}
              <div className="w-full md:w-auto grid grid-cols-3 gap-2 md:gap-4">
                <motion.div 
                  whileHover="hover"
                  whileTap="tap"
                  variants={cardVariants}
                  className="bg-zinc-800/60 rounded-xl p-3 text-center border border-zinc-700/50 shadow-md"
                >
                  <div className="text-lg md:text-2xl font-semibold text-white">{stats.forms.total + stats.bookings.total + stats.facebook.total}</div>
                  <div className="text-xs text-zinc-400">Lead totali</div>
                </motion.div>
                <div className="flex items-center justify-center">
                  <ArrowRight size={isMobile ? 18 : 24} className="text-zinc-600" />
                </div>
                <motion.div 
                  whileHover="hover"
                  whileTap="tap"
                  variants={cardVariants}
                  className="bg-zinc-800/60 rounded-xl p-3 text-center border border-zinc-700/50 shadow-md"
                >
                  <div className="text-lg md:text-2xl font-semibold text-emerald-400">{stats.forms.converted + stats.bookings.converted + stats.facebook.converted}</div>
                  <div className="text-xs text-zinc-400">Clienti acquisiti</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
          
          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Form", icon: <FileText size={20} />, color: "blue", link: "/forms", count: stats.forms.total },
              { name: "Prenotazioni", icon: <Bookmark size={20} />, color: "purple", link: "/bookings", count: stats.bookings.total },
              { name: "Facebook", icon: <Facebook size={20} />, color: "indigo", link: "/facebook-leads", count: stats.facebook.total },
              { name: "Calendario", icon: <Calendar size={20} />, color: "gray", link: "/calendar", count: null }
            ].map((item, index) => (
              <motion.div
                key={item.name}
                variants={fadeIn}
                custom={index + 3}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.97 }}
              >
                <Link href={item.link} className="block h-full">
                  <div className={`h-full bg-gradient-to-br from-${item.color}-900/20 to-${item.color}-800/5 rounded-xl p-4 border border-${item.color}-700/20 shadow-md backdrop-blur-sm`}>
                    <div className="flex items-center">
                      <div className={`bg-${item.color}-500/10 p-2 rounded-lg mr-3`}>
                        <div className={`text-${item.color}-400`}>{item.icon}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{item.name}</div>
                        <div className="text-xs text-zinc-400">
                          {item.count !== null ? `${item.count} contatti` : "Visualizza"}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent activity */}
      <motion.div
        variants={fadeIn}
        custom={7}
        initial="hidden"
        animate="visible" 
        className="bg-gradient-to-br from-zinc-800/70 to-zinc-900/50 rounded-xl border border-zinc-700/50 shadow-lg backdrop-blur-sm overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-700/50">
          <h2 className="text-base font-medium flex items-center text-white">
            <Clock size={18} className="mr-2 text-blue-400" />
            Attività recenti
          </h2>
          <Link href="/events">
            <motion.div
              whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg bg-zinc-800/70 border border-zinc-700/50 shadow-sm"
            >
              <ChevronRight size={18} />
            </motion.div>
          </Link>
        </div>
        
        <div className="p-4">
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {recentEvents.slice(0, 5).map((event: Event, index: number) => (
                  <motion.div 
                    key={index}
                    variants={fadeIn}
                    custom={index + 8}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50"
                  >
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${event.success ? 'bg-emerald-500' : 'bg-rose-500'} mr-3`}></div>
                      <div>
                        <div className="font-medium text-sm text-white">{event.eventName}</div>
                        <div className="text-xs text-zinc-400">{event.leadType === 'form' ? 'Form contatto' : 'Prenotazione'}</div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500">{formatDate(event.createdAt)}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 text-center text-zinc-500"
            >
              <Clock size={24} className="mx-auto mb-2 text-zinc-600" />
              <p className="text-sm">Nessuna attività recente</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}