"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import axios from 'axios';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Clock, 
  CheckCheck, 
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Bot,
  Calendar,
  MoreVertical,
  X,
  BarChart,
  Plus,
  Play,
  Pause,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

// Definizione dell'URL base dell'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.costruzionedigitale.com';

// Cache per i messaggi in draft (5 minuti di timeout)
interface MessageDraft {
  content: string;
  timestamp: number;
}

const DRAFT_CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minuti

// Animazioni Apple-like
const appleEasing = [0.4, 0.0, 0.2, 1];
const springTransition = {
  type: "spring",
  damping: 25,
  stiffness: 300,
};

const smoothTransition = {
  duration: 0.4,
  ease: appleEasing,
};

// Interfacce TypeScript (mantengo le stesse del codice originale)
interface Cliente {
  nome?: string;
  email?: string;
  telefono: string;
  whatsappNumber?: string;
  normalizedNumber?: string;
  contactName?: string;
  fonte?: string;
}

interface ConversationStats {
  totalMessages: number;
  userMessages: number;
  botMessages: number;
  avgResponseTime: number;
  completionRate: number;
}

interface Conversation {
  conversationId: string;
  cliente: Cliente;
  status: 'active' | 'completed' | 'abandoned' | 'blocked' | 'archived';
  currentStep?: string;
  startTime: string;
  lastActivity: string;
  endTime?: string;
  totalDuration?: number;
  stats?: ConversationStats;
  datiRaccolti?: {
    nome?: string;
    email?: string;
    data?: string;
    ora?: string;
    sitoWeb?: string;
    paginaFacebook?: string;
    note?: string;
  };
  risultato?: 'appointment_booked' | 'lead_qualified' | 'not_interested' | 'incomplete' | 'error';
  appointmentSaved?: boolean;
  appointmentId?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isProactive?: boolean;
}

interface Message {
  messageId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  whatsappMessageId?: string;
  whatsappTimestamp?: string;
  aiGenerated?: boolean;
  responseTime?: number;
  delivered?: boolean;
  read?: boolean;
  failed?: boolean;
  failureReason?: string;
  isFirstContact?: boolean;
  triggerredStep?: string;
  metadata?: Record<string, any>;
}

interface ConversationDetails {
  conversation: Conversation;
  messages: Message[];
  summary?: {
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    avgResponseTime: number;
    duration: number;
  };
}

interface WhatsAppStats {
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  conversionRate: number;
}

interface UserConfig {
  mongodb_uri?: string;
  access_token?: string;
  meta_pixel_id?: string;
  fb_account_id?: string;
  marketing_api_token?: string;
  whatsapp_access_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_webhook_token?: string;
  whatsapp_verify_token?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  status?: string;
  message?: string;
  data?: T;
  error?: string;
}

interface ConversationsResponse {
  conversations: Conversation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

type ConnectionStatus = 'checking' | 'connected' | 'error';
type StatusFilter = 'all' | 'active' | 'completed' | 'abandoned' | 'blocked' | 'archived';

// Componente per indicatore stato bot
const BotStatusIndicator: React.FC<{
    conversationId: string;
    botControlStates: Map<string, any>;
  }> = ({ conversationId, botControlStates }) => {
    const status = botControlStates.get(conversationId) || { isPaused: false };
    
    return (
      <motion.div 
        className="flex items-center text-xs"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springTransition}
      >
        <motion.div 
          className={`w-2 h-2 rounded-full mr-2 ${
            status.isPaused ? 'bg-orange-500' : 'bg-green-500'
          }`}
          animate={{ 
            scale: status.isPaused ? [1, 1.2, 1] : 1,
          }}
          transition={{ 
            repeat: status.isPaused ? Infinity : 0,
            duration: 2,
          }}
        />
        <span className={status.isPaused ? 'text-orange-400' : 'text-green-400'}>
          Bot {status.isPaused ? 'In Pausa' : 'Attivo'}
        </span>
      </motion.div>
    );
  };

// Componente per bottoni controllo bot
const BotControlButtons: React.FC<{
  conversationId: string;
  botControlStates: Map<string, any>;
  onPauseBot: () => void;
  onResumeBot: () => void;
  isResponding: boolean;
}> = ({ conversationId, botControlStates, onPauseBot, onResumeBot, isResponding }) => {
  const status = botControlStates.get(conversationId) || { isPaused: false };
  
  if (status.isPaused) {
    return (
      <motion.button
        onClick={onResumeBot}
        disabled={isResponding}
        className="p-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 transition-all duration-300"
        title="Riattiva Bot Automatico"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={springTransition}
      >
        <Play size={16} />
      </motion.button>
    );
  } else {
    return (
      <motion.button
        onClick={onPauseBot}
        disabled={isResponding}
        className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-600 transition-all duration-300"
        title="Metti in Pausa Bot (Gestione Manuale)"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={springTransition}
      >
        <Pause size={16} />
      </motion.button>
    );
  }
};

// Componente menu azioni conversazione
const ConversationActionsMenu: React.FC<{
  conversationId: string;
  botControlStates: Map<string, any>;
  onPauseBot: () => void;
  onResumeBot: () => void;
}> = ({ conversationId, botControlStates, onPauseBot, onResumeBot }) => {
  const [showMenu, setShowMenu] = useState(false);
  const status = botControlStates.get(conversationId) || { isPaused: false };
  
  return (
    <div className="relative">
      <motion.button 
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={springTransition}
      >
        <MoreVertical size={16} />
      </motion.button>
      
      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={smoothTransition}
            className="absolute right-0 mt-2 w-48 bg-zinc-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-700/50 z-10"
          >
            <div className="p-2">
              {status.isPaused ? (
                <motion.button
                  onClick={() => {
                    onResumeBot();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-3 text-sm text-green-400 hover:bg-zinc-700/50 rounded-xl flex items-center transition-colors duration-200"
                  whileHover={{ x: 4 }}
                  transition={springTransition}
                >
                  <Play size={14} className="mr-3" />
                  Riattiva Bot
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => {
                    onPauseBot();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-3 text-sm text-orange-400 hover:bg-zinc-700/50 rounded-xl flex items-center transition-colors duration-200"
                  whileHover={{ x: 4 }}
                  transition={springTransition}
                >
                  <Pause size={14} className="mr-3" />
                  Gestione Manuale
                </motion.button>
              )}
              <motion.button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-3 py-3 text-sm text-zinc-400 hover:bg-zinc-700/50 rounded-xl flex items-center transition-colors duration-200"
                whileHover={{ x: 4 }}
                transition={springTransition}
              >
                <Calendar size={14} className="mr-3" />
                Pianifica Follow-up
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente principale WhatsApp Chats
const WhatsAppChats: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>('');
  const [whatsappStats, setWhatsappStats] = useState<WhatsAppStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [showStats, setShowStats] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNewChatModal, setShowNewChatModal] = useState<boolean>(false);
  const [newChatPhone, setNewChatPhone] = useState<string>('');
  const [newChatName, setNewChatName] = useState<string>('');
  const [lastBotStatesFetch, setLastBotStatesFetch] = useState<number>(0);
  const [isFetchingBotStates, setIsFetchingBotStates] = useState<boolean>(false);
  const [showChatOnMobile, setShowChatOnMobile] = useState<boolean>(false);

  // Nuovi state per controllo bot
  const [botControlStates, setBotControlStates] = useState<Map<string, any>>(new Map());
  const [showBotControlModal, setShowBotControlModal] = useState<boolean>(false);
  const [botControlAction, setBotControlAction] = useState<'pause' | 'resume' | null>(null);
  const [pauseReason, setPauseReason] = useState<string>('');

  // ✨ NUOVO: Sistema di caching per draft messaggi
  const [messageDrafts, setMessageDrafts] = useState<Map<string, MessageDraft>>(new Map());
  const [previousConversationId, setPreviousConversationId] = useState<string | null>(null);

  // ✨ NUOVO: Motion values per animazioni fluide
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-50, 0, 50], [0, 1, 0]);

  // ✨ NUOVO: Gestione cache messaggi
  const saveDraftMessage = (conversationId: string, content: string) => {
    if (!content.trim()) {
      // Se il messaggio è vuoto, rimuovi il draft
      setMessageDrafts(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
      return;
    }

    setMessageDrafts(prev => new Map(prev.set(conversationId, {
      content: content,
      timestamp: Date.now()
    })));
  };

  const loadDraftMessage = (conversationId: string): string => {
    const draft = messageDrafts.get(conversationId);
    if (!draft) return '';

    // Controlla se il draft è scaduto
    if (Date.now() - draft.timestamp > DRAFT_CACHE_TIMEOUT) {
      setMessageDrafts(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
      return '';
    }

    return draft.content;
  };

  // ✨ NUOVO: Cleanup automatico dei draft scaduti
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setMessageDrafts(prev => {
        const newMap = new Map();
        prev.forEach((draft, conversationId) => {
          if (now - draft.timestamp < DRAFT_CACHE_TIMEOUT) {
            newMap.set(conversationId, draft);
          }
        });
        return newMap;
      });
    }, 60000); // Cleanup ogni minuto

    return () => clearInterval(cleanup);
  }, []);

  // ✨ NUOVO: Gestione cambio conversazione con caching
  const handleConversationSelect = (conversationId: string) => {
    // Salva il draft della conversazione corrente
    if (selectedConversation && newMessage.trim()) {
      saveDraftMessage(selectedConversation.conversation.conversationId, newMessage);
    }

    // Carica il draft della nuova conversazione
    const draft = loadDraftMessage(conversationId);
    setNewMessage(draft);

    // Imposta la conversazione precedente
    setPreviousConversationId(selectedConversation?.conversation.conversationId || null);

    // Carica la nuova conversazione
    fetchConversationDetails(conversationId);
  };

  // Fetch configurazione utente
  useEffect(() => {
    fetchUserConfig();
  }, []);

  // Fetch conversazioni e test connessione
  const isRefreshing = useRef(false);

  useEffect(() => {
    if (config && config.whatsapp_access_token && conversations.length > 0) {
      console.log('🔄 Initial bot states fetch after conversations loaded');
      fetchBotStatesForVisibleConversations();
    }
  }, [conversations, config]);
  
  useEffect(() => {
    if (config && config.whatsapp_access_token) {
      testWhatsAppConnection();
      fetchConversations();
      fetchWhatsAppStats();
      
      const fetchAllData = async () => {
        if (isRefreshing.current) {
          console.log('⏭️ Skipping auto-refresh - already refreshing');
          return;
        }
        
        isRefreshing.current = true;
        console.log('🔄 Auto-refresh (conversazioni + stati bot)');
        
        try {
          await Promise.all([
            fetchConversations(),
            fetchWhatsAppStats()
          ]);
          
          setTimeout(() => {
            fetchBotStatesForVisibleConversations();
          }, 100);
          
        } finally {
          isRefreshing.current = false;
        }
      };
      
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [config, statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('id');
    
    if (conversationId && conversations.length > 0) {
      const selectedConv = conversations.find(c => c.conversationId === conversationId);
      
      if (selectedConv) {
        handleConversationSelect(conversationId);
        
        setTimeout(() => {
          const element = document.querySelector(`[data-conversation-id="${conversationId}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-primary/10', 'ring-2', 'ring-primary');
            
            setTimeout(() => {
              element.classList.remove('bg-primary/10', 'ring-2', 'ring-primary');
            }, 3000);
          }
        }, 500);
        
        if (window.history.replaceState) {
          const url = new URL(window.location.href);
          url.searchParams.delete('id');
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    }
  }, [conversations]);

  const fetchBotStatesForVisibleConversations = async (): Promise<void> => {
    const now = Date.now();
    if (now - lastBotStatesFetch < 3000) {
      console.log('⏭️ Skipping bot states fetch - too recent');
      return;
    }
    
    if (isFetchingBotStates) {
      console.log('⏭️ Skipping bot states fetch - already in progress');
      return;
    }
    
    const conversationsToFetch = conversations.slice(0, 10);
    
    if (conversationsToFetch.length === 0) {
      console.log('✅ No conversations to fetch bot states for');
      return;
    }
    
    setIsFetchingBotStates(true);
    setLastBotStatesFetch(now);
    
    console.log(`🔄 Loading/updating bot states for ${conversationsToFetch.length} conversations`);
    
    try {
      const statePromises = conversationsToFetch.map(async (conversation) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/whatsapp/bot-status/${conversation.conversationId}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.success) {
            return {
              conversationId: conversation.conversationId,
              status: data.data.botControl || { isPaused: false }
            };
          } else {
            console.warn(`❌ Bot status fetch failed for ${conversation.conversationId}:`, data.message);
          }
        } catch (error) {
          console.error(`❌ Error fetching bot status for ${conversation.conversationId}:`, error);
        }
        
        return {
          conversationId: conversation.conversationId,
          status: { isPaused: false }
        };
      });
      
      const results = await Promise.allSettled(statePromises);
      
      setBotControlStates(prev => {
        const newMap = new Map(prev);
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            newMap.set(result.value.conversationId, result.value.status);
            console.log(`✅ Updated bot state for ${result.value.conversationId}:`, result.value.status);
          }
        });
        return newMap;
      });
      
      console.log(`✅ Bot states loaded/updated for ${conversationsToFetch.length} conversations`);
      
    } catch (error) {
      console.error('❌ Error in fetchBotStatesForVisibleConversations:', error);
    } finally {
      setIsFetchingBotStates(false);
    }
  };
  
  // Scroll ai messaggi più recenti
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchTerm || 
      conv.cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.cliente.telefono?.includes(searchTerm) ||
      conv.conversationId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserConfig = async (): Promise<void> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user/config`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setConfig(response.data.config || null);
      } else {
        console.error('Errore recupero configurazione:', response.data.message);
      }
    } catch (error) {
      console.error('Errore fetch configurazione:', error);
    }
  };

  const testWhatsAppConnection = async (): Promise<void> => {
    try {
      setConnectionStatus('checking');
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/test-connection`, {
        credentials: 'include'
      });
      const data: ApiResponse<any> = await response.json();
      
      setConnectionStatus(data.success ? 'connected' : 'error');
      if (!data.success) {
        console.error('Errore connessione WhatsApp:', data.message);
      }
    } catch (error) {
      console.error('Errore test connessione:', error);
      setConnectionStatus('error');
    }
  };

  const fetchWhatsAppStats = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/stats`, {
        credentials: 'include'
      });
      const data: ApiResponse<WhatsAppStats> = await response.json();
      
      if (data.success && data.data) {
        setWhatsappStats(data.data);
      }
    } catch (error) {
      console.error('Errore fetch statistiche:', error);
    }
  };

  const fetchConversations = async (): Promise<void> => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations?${params}`, {
        credentials: 'include'
      });
      const data: ApiResponse<ConversationsResponse> = await response.json();
      
      if (data.status === 'success' && data.data) {
        setConversations(data.data.conversations || []);
      }
    } catch (error) {
      console.error('Errore fetch conversazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetails = async (conversationId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
        credentials: 'include'
      });
      const data: ApiResponse<ConversationDetails> = await response.json();
      
      if (data.status === 'success' && data.data) {
        setSelectedConversation(data.data);
        setShowChatOnMobile(true);
      }
    } catch (error) {
      console.error('Errore fetch dettagli conversazione:', error);
    }
  };

  const pauseBot = async (conversationId: string, reason: string = '') => {
    try {
      setIsResponding(true);
      
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/pause-bot/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
  
      const data = await response.json();
  
      if (data.success) {
        setBotControlStates(prev => new Map(prev.set(conversationId, {
          isPaused: true,
          pausedAt: new Date(),
          pausedBy: data.data.pausedBy,
          pauseReason: reason
        })));
        
        console.log('✅ Bot messo in pausa per conversazione:', conversationId);
        
        setTimeout(() => {
          fetchBotStateForSingleConversation(conversationId);
        }, 500);
        
        setShowBotControlModal(false);
        setPauseReason('');
      } else {
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error('Errore pausa bot:', error);
      alert('Errore nel mettere in pausa il bot');
    } finally {
      setIsResponding(false);
    }
  };

  const resumeBot = async (conversationId: string) => {
    try {
      setIsResponding(true);
      
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/resume-bot/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
  
      const data = await response.json();
  
      if (data.success) {
        setBotControlStates(prev => new Map(prev.set(conversationId, {
          isPaused: false,
          resumedAt: new Date(),
          resumedBy: data.data.resumedBy
        })));
        
        console.log('✅ Bot riattivato per conversazione:', conversationId);
        
        setTimeout(() => {
          fetchBotStateForSingleConversation(conversationId);
        }, 500);
      } else {
        alert(`Errore: ${data.message}`);
      }
    } catch (error) {
      console.error('Errore riattivazione bot:', error);
      alert('Errore nel riattivare il bot');
    } finally {
      setIsResponding(false);
    }
  };
  
  const fetchBotStateForSingleConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/bot-status/${conversationId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBotControlStates(prev => new Map(prev.set(conversationId, data.data.botControl)));
        console.log(`🔄 Refreshed bot state for ${conversationId}:`, data.data.botControl);
      }
    } catch (error) {
      console.error(`Error refreshing bot state for ${conversationId}:`, error);
    }
  };  

  const sendMessage = async (): Promise<void> => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      setIsResponding(true);
      
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          to: selectedConversation.conversation.cliente.telefono,
          message: newMessage,
          conversationId: selectedConversation.conversation.conversationId
        })
      });

      const data: ApiResponse<any> = await response.json();

      if (data.success) {
        const newMsg: Message = {
          role: 'assistant',
          content: newMessage,
          timestamp: new Date().toISOString(),
          delivered: true,
          metadata: { sentManually: true }
        };
        
        setSelectedConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, newMsg]
          };
        });
        
        // ✨ Pulisci il draft dopo l'invio
        saveDraftMessage(selectedConversation.conversation.conversationId, '');
        setNewMessage('');
        scrollToBottom();
        
        setTimeout(() => {
          fetchConversationDetails(selectedConversation.conversation.conversationId);
        }, 1000);
      } else {
        alert(`Errore invio messaggio: ${data.message || 'Errore sconosciuto'}`);
      }
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      alert('Errore durante l\'invio del messaggio');
    } finally {
      setIsResponding(false);
    }
  };

  const startNewConversation = async (): Promise<void> => {
    if (!newChatPhone.trim()) {
      alert('Inserisci un numero di telefono valido');
      return;
    }
  
    try {
      setIsResponding(true);
      
      let normalizedPhone = newChatPhone.trim();
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+39' + normalizedPhone.substring(1);
      } else if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+39' + normalizedPhone;
      }
  
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/start-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          phone: normalizedPhone,
          name: newChatName.trim() || 'Nuovo Contatto'
        })
      });
  
      const data: ApiResponse<ConversationDetails> = await response.json();
  
      if (data.success && data.data) {
        setSelectedConversation(data.data);
        
        setConversations(prev => {
          const exists = prev.find(conv => conv.conversationId === data.data!.conversation.conversationId);
          if (!exists) {
            return [data.data!.conversation, ...prev];
          }
          return prev;
        });
        
        setShowNewChatModal(false);
        setNewChatPhone('');
        setNewChatName('');
        
        console.log('Nuova conversazione creata:', data.data.conversation.conversationId);
      } else {
        alert(`Errore: ${data.message || 'Impossibile creare la conversazione'}`);
      }
    } catch (error) {
      console.error('Errore nella creazione della nuova conversazione:', error);
      alert('Errore durante la creazione della conversazione');
    } finally {
      setIsResponding(false);
    }
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'active': 'text-green-400',
      'completed': 'text-blue-400',
      'abandoned': 'text-yellow-400',
      'blocked': 'text-red-400',
      'archived': 'text-gray-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'active': 'Attiva',
      'completed': 'Completata',
      'abandoned': 'Abbandonata',
      'blocked': 'Bloccata',
      'archived': 'Archiviata'
    };
    return labels[status] || status;
  };

  const getConnectionStatusColor = (status: ConnectionStatus): string => {
    const colors: Record<ConnectionStatus, string> = {
      'connected': 'text-green-400',
      'checking': 'text-yellow-400',
      'error': 'text-red-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const getConnectionStatusLabel = (status: ConnectionStatus): string => {
    const labels: Record<ConnectionStatus, string> = {
      'connected': 'Connesso',
      'checking': 'Verifica...',
      'error': 'Errore'
    };
    return labels[status] || 'Sconosciuto';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ✨ NUOVO: Aggiorna draft in tempo reale
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Salva il draft solo se c'è una conversazione selezionata
    if (selectedConversation) {
      saveDraftMessage(selectedConversation.conversation.conversationId, value);
    }
  };

  if (!config?.whatsapp_access_token) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <motion.div 
          className="text-center text-zinc-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={smoothTransition}
        >
          <MessageCircle size={48} className="mx-auto mb-4 text-zinc-600" />
          <h2 className="text-xl font-semibold mb-2">Configurazione WhatsApp mancante</h2>
          <p>Configura WhatsApp Business API nelle impostazioni per utilizzare questa funzione.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-900 text-white flex flex-col overflow-hidden">
      {/* Dashboard delle statistiche - Fissato in alto */}
      <AnimatePresence>
        {showStats && whatsappStats && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={smoothTransition}
            className="p-4 bg-zinc-800/95 backdrop-blur-xl border-b border-zinc-700/50 relative z-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Statistiche WhatsApp</h2>
              <motion.button
                onClick={() => setShowStats(false)}
                className="p-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={16} />
              </motion.button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { label: 'Conversazioni Totali', value: whatsappStats.totalConversations, color: 'text-white' },
                { label: 'Attive', value: whatsappStats.activeConversations, color: 'text-green-400' },
                { label: 'Completate', value: whatsappStats.completedConversations, color: 'text-blue-400' },
                { label: 'Bot in Pausa', value: Array.from(botControlStates.values()).filter(state => state.isPaused).length, color: 'text-orange-400' },
                { label: 'Messaggi Totali', value: whatsappStats.totalMessages, color: 'text-white' },
                { label: 'Conversion Rate', value: `${whatsappStats.conversionRate}%`, color: 'text-purple-400' }
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="bg-zinc-700/50 backdrop-blur-sm rounded-2xl p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, ...smoothTransition }}
                >
                  <div className="text-sm text-zinc-400">{stat.label}</div>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Lista conversazioni in pausa */}
            {Array.from(botControlStates.entries()).filter(([_, state]) => state.isPaused).length > 0 && (
              <motion.div 
                className="mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, ...smoothTransition }}
              >
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Conversazioni in Gestione Manuale:</h3>
                <div className="space-y-1">
                  {Array.from(botControlStates.entries())
                    .filter(([_, state]) => state.isPaused)
                    .slice(0, 3)
                    .map(([conversationId, state]) => {
                      const conv = filteredConversations.find(c => c.conversationId === conversationId);
                      return (
                        <motion.div 
                          key={conversationId} 
                          className="text-xs text-orange-300 bg-orange-900/20 backdrop-blur-sm rounded-xl px-3 py-2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={springTransition}
                        >
                          {conv?.cliente.nome || 'Utente'} - In pausa da: {state.pausedBy}
                        </motion.div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenuto principale - Layout fisso */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lista conversazioni */}
        <div className={`${showChatOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-zinc-800/50 flex-col`}>
          {/* Header sidebar - Fisso */}
          <div className="p-4 border-b border-zinc-800/50 bg-zinc-800/30 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <motion.h1 
                className="text-xl font-bold flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={springTransition}
              >
                <MessageCircle className="mr-2 text-green-400" size={24} />
                WhatsApp Chats
              </motion.h1>
              <div className="flex items-center space-x-2">
                {[
                  { icon: Plus, onClick: () => setShowNewChatModal(true), title: "Nuova Conversazione", bg: "bg-green-600 hover:bg-green-500" },
                  { icon: BarChart, onClick: () => setShowStats(!showStats), title: "Mostra/Nascondi Statistiche", bg: "bg-zinc-700 hover:bg-zinc-600" },
                  { icon: RefreshCw, onClick: fetchConversations, title: "Aggiorna", bg: "bg-zinc-700 hover:bg-zinc-600", loading }
                ].map((button, index) => (
                  <motion.button
                    key={index}
                    onClick={button.onClick}
                    disabled={button.loading}
                    className={`p-2 rounded-xl ${button.bg} transition-all duration-300`}
                    title={button.title}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springTransition}
                  >
                    <button.icon size={16} className={button.loading ? 'animate-spin' : ''} />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Stato connessione */}
            <motion.div 
              className="flex items-center mb-3 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, ...smoothTransition }}
            >
              <motion.div 
                className={`w-2 h-2 rounded-full mr-2 ${getConnectionStatusColor(connectionStatus).replace('text-', 'bg-')}`}
                animate={{ 
                  scale: connectionStatus === 'checking' ? [1, 1.2, 1] : 1,
                }}
                transition={{ 
                  repeat: connectionStatus === 'checking' ? Infinity : 0,
                  duration: 1.5,
                }}
              />
              <span className={getConnectionStatusColor(connectionStatus)}>
                {getConnectionStatusLabel(connectionStatus)}
              </span>
            </motion.div>
            
            {/* Search */}
            <motion.div 
              className="relative mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...smoothTransition }}
            >
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cerca conversazioni..."
                className="w-full pl-10 pr-4 py-3 bg-zinc-700/50 backdrop-blur-sm border border-zinc-600/50 rounded-2xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </motion.div>

            {/* Filter */}
            <motion.select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full p-3 bg-zinc-700/50 backdrop-blur-sm border border-zinc-600/50 rounded-2xl text-sm focus:ring-2 focus:ring-green-500 transition-all duration-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...smoothTransition }}
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Attive</option>
              <option value="completed">Completate</option>
              <option value="abandoned">Abbandonate</option>
            </motion.select>
          </div>

          {/* Lista conversazioni - Scrollabile */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <motion.div 
                className="p-4 text-center text-zinc-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                Caricamento conversazioni...
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredConversations.map((conversation, index) => {
                  const botStatus = botControlStates.get(conversation.conversationId) || { isPaused: false };
                  const isSelected = selectedConversation?.conversation.conversationId === conversation.conversationId;
                  
                  return (
                    <motion.div
                      key={conversation.conversationId}
                      layout
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      whileHover={{ 
                        backgroundColor: "rgba(63, 63, 70, 0.3)",
                        transition: { duration: 0.2 }
                      }}
                      transition={{ delay: index * 0.05, ...springTransition }}
                      onClick={() => handleConversationSelect(conversation.conversationId)}
                      className={`p-4 border-b border-zinc-800/30 cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'bg-zinc-800/50 backdrop-blur-sm border-l-4 border-green-400' 
                          : ''
                      } ${botStatus.isPaused ? 'border-l-4 border-l-orange-500' : ''}`}
                      data-conversation-id={conversation.conversationId}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <motion.div 
                            className="flex items-center mb-1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.1, ...smoothTransition }}
                          >
                            <User size={16} className="mr-2 text-zinc-400" />
                            <span className="font-medium text-sm">
                              {conversation.cliente.nome || conversation.cliente.contactName || 'Utente'}
                            </span>
                            
                            {/* Indicatore stato bot */}
                            <AnimatePresence>
                              {botStatus.isPaused && (
                                <motion.div 
                                  className="ml-2 flex items-center"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={springTransition}
                                >
                                  <Pause size={12} className="text-orange-400 mr-1" />
                                  <span className="text-xs text-orange-400 font-medium">MANUALE</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                          
                          <motion.div 
                            className="flex items-center text-xs text-zinc-400 mb-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.2, ...smoothTransition }}
                          >
                            <Phone size={12} className="mr-1" />
                            {conversation.cliente.telefono}
                          </motion.div>
                          
                          <motion.div 
                            className="flex items-center justify-between"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + 0.3, ...smoothTransition }}
                          >
                            <span className={`text-xs font-medium ${getStatusColor(conversation.status)}`}>
                              {getStatusLabel(conversation.status)}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {formatTime(conversation.lastActivity)}
                            </span>
                          </motion.div>
                          
                          {/* Info aggiuntive se bot in pausa */}
                          <AnimatePresence>
                            {botStatus.isPaused && botStatus.pausedBy && (
                              <motion.div 
                                className="mt-2 text-xs text-orange-300 bg-orange-900/20 backdrop-blur-sm rounded-xl px-2 py-1"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={springTransition}
                              >
                                In pausa da: {botStatus.pausedBy}
                                {botStatus.pauseReason && (
                                  <div className="text-orange-400">{botStatus.pauseReason}</div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            
            {!loading && filteredConversations.length === 0 && (
              <motion.div 
                className="p-8 text-center text-zinc-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={smoothTransition}
              >
                <MessageCircle size={48} className="mx-auto mb-4 text-zinc-600" />
                <p>Nessuna conversazione trovata</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Main content - Chat details */}
        <div className={`${showChatOnMobile ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          {selectedConversation ? (
            <>
              {/* Header chat con controlli bot - Fisso in alto */}
              <motion.div 
                className="p-4 border-b border-zinc-800/50 bg-zinc-800/30 backdrop-blur-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={smoothTransition}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {/* Pulsante back per mobile */}
                    <motion.button
                      onClick={() => setShowChatOnMobile(false)}
                      className="md:hidden p-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition-all duration-300 mr-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowLeft size={16} />
                    </motion.button>
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, ...smoothTransition }}
                    >
                      <User size={20} className="mr-3 text-green-400" />
                      <div>
                        <h2 className="font-semibold">
                          {selectedConversation.conversation.cliente.nome || 
                           selectedConversation.conversation.cliente.contactName || 
                           'Utente'}
                        </h2>
                        <p className="text-sm text-zinc-400">
                          {selectedConversation.conversation.cliente.telefono}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                  <motion.div 
                    className="flex items-center space-x-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, ...smoothTransition }}
                  >
                    {/* Stato Bot */}
                    <BotStatusIndicator 
                      conversationId={selectedConversation.conversation.conversationId}
                      botControlStates={botControlStates}
                    />
                    
                    {/* Controlli Bot */}
                    <BotControlButtons
                      conversationId={selectedConversation.conversation.conversationId}
                      botControlStates={botControlStates}
                      onPauseBot={() => {
                        setBotControlAction('pause');
                        setShowBotControlModal(true);
                      }}
                      onResumeBot={() => resumeBot(selectedConversation.conversation.conversationId)}
                      isResponding={isResponding}
                    />
                    
                    <motion.span 
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedConversation.conversation.status)}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={springTransition}
                    >
                      {getStatusLabel(selectedConversation.conversation.status)}
                    </motion.span>
                    
                    <ConversationActionsMenu
                      conversationId={selectedConversation.conversation.conversationId}
                      botControlStates={botControlStates}
                      onPauseBot={() => {
                        setBotControlAction('pause');
                        setShowBotControlModal(true);
                      }}
                      onResumeBot={() => resumeBot(selectedConversation.conversation.conversationId)}
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* Messaggi - Scrollabile */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence mode="popLayout">
                  {selectedConversation.messages.map((message, index) => (
                    <motion.div
                      key={`${message.messageId || index}`}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ delay: index * 0.02, ...springTransition }}
                      className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <motion.div 
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.role === 'user' 
                            ? 'bg-zinc-700/50 backdrop-blur-sm text-white' 
                            : 'bg-green-600/90 backdrop-blur-sm text-white'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        transition={springTransition}
                      >
                        <div className="flex items-start space-x-2">
                          {message.role === 'user' ? (
                            <User size={16} className="mt-1 text-zinc-400" />
                          ) : (
                            <Bot size={16} className="mt-1 text-green-200" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs opacity-70">
                                {formatTime(message.timestamp)}
                              </span>
                              {message.role === 'assistant' && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.5, ...springTransition }}
                                >
                                  <CheckCheck size={12} className={message.delivered ? 'text-green-200' : 'text-zinc-400'} />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input messaggio - Fisso in basso */}
              <motion.div 
                className="p-4 border-t border-zinc-800/50 bg-zinc-800/30 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={smoothTransition}
              >
                <div className="flex space-x-3">
                  <motion.input
                    type="text"
                    placeholder="Scrivi un messaggio..."
                    className="flex-1 px-4 py-3 bg-zinc-700/50 backdrop-blur-sm border border-zinc-600/50 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyPress={handleKeyPress}
                    disabled={isResponding}
                    whileFocus={{ scale: 1.02 }}
                    transition={springTransition}
                  />
                  <motion.button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isResponding}
                    className="px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-2xl transition-all duration-300 flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springTransition}
                  >
                    {isResponding ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div 
              className="hidden md:flex flex-1 flex-col items-center justify-center text-zinc-500"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={smoothTransition}
            >
              <div className="text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <MessageCircle size={64} className="mx-auto mb-4 text-zinc-600" />
                </motion.div>
                <h3 className="text-xl font-medium mb-2">Seleziona una conversazione</h3>
                <p>Scegli una conversazione dalla lista per iniziare a chattare</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal Nuova Conversazione */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowNewChatModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={springTransition}
              className="bg-zinc-800/95 backdrop-blur-xl rounded-3xl p-6 w-full max-w-md mx-4 border border-zinc-700/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Nuova Conversazione</h2>
                <motion.button
                  onClick={() => setShowNewChatModal(false)}
                  className="p-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={16} />
                </motion.button>
              </div>
              
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, ...smoothTransition }}
                >
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Numero di Telefono *
                  </label>
                  <input
                    type="tel"
                    placeholder="+39 123 456 7890 o 0123456789"
                    className="w-full px-4 py-3 bg-zinc-700/50 backdrop-blur-sm border border-zinc-600/50 rounded-2xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    value={newChatPhone}
                    onChange={(e) => setNewChatPhone(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        startNewConversation();
                      }
                    }}
                  />
                  <div className="text-xs text-zinc-400 mt-1">
                    Formato: +39 oppure inizia con 0 per numeri italiani
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, ...smoothTransition }}
                >
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Nome (opzionale)
                  </label>
                  <input
                    type="text"
                    placeholder="Nome del contatto"
                    className="w-full px-4 py-3 bg-zinc-700/50 backdrop-blur-sm border border-zinc-600/50 rounded-2xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        startNewConversation();
                      }
                    }}
                  />
                </motion.div>
                
                <motion.div 
                  className="flex space-x-3 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, ...smoothTransition }}
                >
                  <motion.button
                    onClick={() => setShowNewChatModal(false)}
                    className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-2xl transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Annulla
                  </motion.button>
                  <motion.button
                    onClick={startNewConversation}
                    disabled={!newChatPhone.trim() || isResponding}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-2xl transition-all duration-300 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isResponding ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      'Inizia Chat'
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal per controllo bot */}
      <AnimatePresence>
        {showBotControlModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowBotControlModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={springTransition}
              className="bg-zinc-800/95 backdrop-blur-xl rounded-3xl p-6 w-full max-w-md mx-4 border border-zinc-700/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">
                  {botControlAction === 'pause' ? 'Metti in Pausa Bot' : 'Riattiva Bot'}
                </h2>
                <motion.button
                  onClick={() => setShowBotControlModal(false)}
                  className="p-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={16} />
                </motion.button>
              </div>
              
              {botControlAction === 'pause' ? (
                <div className="space-y-4">
                  <motion.div 
                    className="bg-orange-900/30 border border-orange-600/50 rounded-2xl p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, ...smoothTransition }}
                  >
                    <div className="flex items-start">
                      <AlertTriangle size={16} className="text-orange-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-orange-200 font-medium mb-1">Gestione Manuale</p>
                        <p className="text-orange-300">
                          Il bot smetterà di rispondere automaticamente. Dovrai gestire manualmente i messaggi di questo cliente.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, ...smoothTransition }}
                  >
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Motivo (opzionale)
                    </label>
                    <input
                      type="text"
                      placeholder="es: Cliente VIP, richieste complesse, follow-up personalizzato..."
                      className="w-full px-4 py-3 bg-zinc-700/50 backdrop-blur-sm border border-zinc-600/50 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                      value={pauseReason}
                      onChange={(e) => setPauseReason(e.target.value)}
                    />
                  </motion.div>
                  
                  <motion.div 
                    className="flex space-x-3 pt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ...smoothTransition }}
                  >
                    <motion.button
                      onClick={() => setShowBotControlModal(false)}
                      className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-2xl transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Annulla
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        if (selectedConversation) {
                          pauseBot(selectedConversation.conversation.conversationId, pauseReason);
                        }
                      }}
                      disabled={isResponding}
                      className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-2xl transition-all duration-300 flex items-center justify-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isResponding ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        'Metti in Pausa'
                      )}
                    </motion.button>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-4">
                  <motion.p 
                    className="text-zinc-300"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, ...smoothTransition }}
                  >
                    Vuoi riattivare il bot automatico per questa conversazione?
                  </motion.p>
                  
                  <motion.div 
                    className="flex space-x-3 pt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, ...smoothTransition }}
                  >
                    <motion.button
                      onClick={() => setShowBotControlModal(false)}
                      className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-2xl transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Annulla
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        if (selectedConversation) {
                          resumeBot(selectedConversation.conversation.conversationId);
                        }
                      }}
                      disabled={isResponding}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-2xl transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Riattiva Bot
                    </motion.button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WhatsAppChats;