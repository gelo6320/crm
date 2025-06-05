// app/page.tsx
"use client";

import { useState, useEffect, ReactNode } from "react";
import { 
  Bell, CheckCircle, RefreshCw, 
  Clock, FileText,
  User, Settings, BarChart3, DollarSign
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchNewContacts, markContactAsViewed, markAllContactsAsViewed, fetchUserConfig } from "@/lib/api/dashboard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Contact {
  _id: string;
  leadId: string;
  name: string;
  email: string;
  source: string;
  type: 'form' | 'booking' | 'facebook';
  createdAt: string;
  viewed: boolean;
}

interface UserData {
  name: string;
  companyLogo?: string;
  company?: string;
}

// Card container props
interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
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
    transition={{ duration: 0.6, delay: delay * 0.1, ease: "easeOut" }}
    className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
);

// Notifications panel component
function NotificationsPanel({ 
  notifications, 
  viewedCount, 
  onViewContact, 
  onViewAll 
}: NotificationsPanelProps) {
  
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
  
  const getSourceIcon = () => {
    return <FileText size={16} className="text-primary" />;
  };

  const getSourceColor = () => {
    return 'bg-primary/10 text-primary border border-primary/20';
  };

  return (
    <AnimatedCard className="overflow-hidden h-full flex flex-col max-h-[500px]" delay={2}>
      <div className="p-6 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-montserrat font-semibold flex items-center text-white">
            <Bell size={22} className="mr-3 text-primary" />
            Notifiche
            {viewedCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-3 bg-primary text-white text-xs font-semibold rounded-full px-3 py-1"
              >
                {viewedCount} nuove
              </motion.span>
            )}
          </h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence>
          {notifications.length > 0 ? (
            <motion.div>
              {notifications.map((contact, index) => (
                <motion.div 
                  key={contact._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`p-5 border-b border-white/5 hover:bg-white/5 transition-all duration-300 cursor-pointer
                    ${!contact.viewed ? "bg-primary/5" : ""}
                  `}
                  onClick={() => onViewContact(contact)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-white/10 rounded-xl p-3 mt-1">
                      {getSourceIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-montserrat font-semibold text-white text-base mb-1">
                        {contact.name}
                      </div>
                      <div className="text-sm text-zinc-300 truncate mb-3 font-medium">
                        {contact.email}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-zinc-400 flex items-center font-medium">
                          <Clock size={12} className="mr-1" />
                          {getTimeAgo(contact.createdAt)}
                        </div>
                        <div className={`text-xs px-3 py-1 rounded-full font-semibold ${getSourceColor()}`}>
                          Nuovo contatto
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
              className="h-full flex flex-col items-center justify-center p-12 text-center text-zinc-400"
            >
              <Bell size={32} className="mx-auto mb-4 text-zinc-600 opacity-60" />
              <p className="text-base font-montserrat font-medium">Nessuna notifica</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {notifications.length > 0 && (
        <div className="p-4 border-t border-white/5 flex-shrink-0">
          <motion.button 
            onClick={onViewAll}
            className="w-full inline-flex items-center justify-center py-3 px-6 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 text-sm font-semibold font-montserrat transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CheckCircle size={16} className="mr-2" />
            Segna tutte come viste
          </motion.button>
        </div>
      )}
    </AnimatedCard>
  );
}

export default function Dashboard() {
  const [notifications, setNotifications] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewedCount, setViewedCount] = useState<number>(0);
  const [userData, setUserData] = useState<UserData>({ name: 'Utente' });
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const [newContactsData, userConfigData] = await Promise.all([
        fetchNewContacts(),
        fetchUserConfig()
      ]);
      
      // Solo contatti non visti per le notifiche
      const unviewedContacts = (newContactsData as Contact[]).filter((contact: Contact) => !contact.viewed);
      setNotifications(unviewedContacts);
      setViewedCount(unviewedContacts.length);
      
      // Dati utente
      setUserData({
        name: userConfigData.name || userConfigData.username || 'Utente',
        companyLogo: userConfigData.companyLogo,
        company: userConfigData.company
      });
      
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewContact = async (contact: Contact): Promise<void> => {
    try {
      await markContactAsViewed(contact._id);
      
      setNotifications(prevNotifications => 
        prevNotifications.filter((item: Contact) => item._id !== contact._id)
      );
      
      setViewedCount(prev => Math.max(0, prev - 1));
      
      const idToUse = contact.leadId || contact._id;
      router.push(`/contacts?id=${idToUse}`);
      
    } catch (error) {
      console.error("Error marking contact as viewed:", error);
    }
  };
  
  const handleViewAllContacts = async (): Promise<void> => {
    try {
      await markAllContactsAsViewed();
      
      setNotifications([]);
      setViewedCount(0);
    } catch (error) {
      console.error("Error marking all contacts as viewed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner />
        </motion.div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Buongiorno';
    if (currentHour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  return (
    <div className="h-screen bg-zinc-900 overflow-hidden">
      <div className="h-full flex flex-col max-w-7xl mx-auto px-4 py-8">
        
        {/* Header Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          {/* Logo aziendale */}
          {userData.companyLogo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <img 
                src={userData.companyLogo} 
                alt={userData.company || 'Logo aziendale'}
                className="h-12 w-auto object-contain"
              />
            </motion.div>
          )}
          
          {/* Messaggio di benvenuto */}
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-4xl md:text-5xl font-montserrat font-medium text-white tracking-tight"
          >
            {getGreeting()}, <span className="font-semibold text-primary">{userData.name}</span>!
          </motion.h1>
          
          {/* Sottotitolo profilo aziendale */}
          {userData.company && userData.company.trim() !== '' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-sm text-zinc-400 font-montserrat font-medium mt-2"
            >
              Profilo di {userData.company}
            </motion.p>
          )}
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
          
          {/* Notifications Section - Takes 2 columns */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex-1 min-h-0">
              <NotificationsPanel 
                notifications={notifications} 
                viewedCount={viewedCount}
                onViewContact={handleViewContact}
                onViewAll={handleViewAllContacts}
              />
            </div>
          </div>

          {/* Quick Actions - Takes 1 column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col"
          >
            <h3 className="text-xl font-montserrat font-semibold text-white text-center mb-6">
              Azioni rapide
            </h3>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex flex-col flex-1 space-y-0">
              <Link href="/contacts">
                <motion.div
                  className="bg-white/5 backdrop-blur-xl rounded-t-xl border border-white/10 border-b-0 p-4 text-center hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <User size={24} className="mx-auto mb-3 text-primary" />
                  <h4 className="font-montserrat font-semibold text-white mb-1 text-base">Contatti</h4>
                  <p className="text-xs text-zinc-300 font-montserrat font-medium">
                    Gestisci i tuoi lead
                  </p>
                </motion.div>
              </Link>
              
              <Link href="/tracciamento">
                <motion.div
                  className="bg-white/5 backdrop-blur-xl border border-white/10 border-b-0 p-4 text-center hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BarChart3 size={24} className="mx-auto mb-3 text-blue-400" />
                  <h4 className="font-montserrat font-semibold text-white mb-1 text-base">Dati</h4>
                  <p className="text-xs text-zinc-300 font-montserrat font-medium">
                    Analisi e metriche
                  </p>
                </motion.div>
              </Link>
              
              <Link href="/sales-funnel">
                <motion.div
                  className="bg-white/5 backdrop-blur-xl rounded-b-xl border border-white/10 p-4 text-center hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <DollarSign size={24} className="mx-auto mb-3 text-green-400" />
                  <h4 className="font-montserrat font-semibold text-white mb-1 text-base">Vendita</h4>
                  <p className="text-xs text-zinc-300 font-montserrat font-medium">
                    Funnel di vendita
                  </p>
                </motion.div>
              </Link>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden grid grid-cols-3 gap-0">
              <Link href="/contacts">
                <motion.div
                  className="bg-white/5 backdrop-blur-xl rounded-l-xl border border-white/10 border-r-0 p-4 text-center hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <User size={20} className="mx-auto mb-2 text-primary" />
                  <h4 className="font-montserrat font-semibold text-white text-sm">Contatti</h4>
                </motion.div>
              </Link>
              
              <Link href="/tracciamento">
                <motion.div
                  className="bg-white/5 backdrop-blur-xl border border-white/10 border-r-0 p-4 text-center hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BarChart3 size={20} className="mx-auto mb-2 text-blue-400" />
                  <h4 className="font-montserrat font-semibold text-white text-sm">Dati</h4>
                </motion.div>
              </Link>
              
              <Link href="/sales-funnel">
                <motion.div
                  className="bg-white/5 backdrop-blur-xl rounded-r-xl border border-white/10 p-4 text-center hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <DollarSign size={20} className="mx-auto mb-2 text-green-400" />
                  <h4 className="font-montserrat font-semibold text-white text-sm">Vendita</h4>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}