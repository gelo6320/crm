"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertTriangle
} from 'lucide-react';

// Definizione dell'URL base dell'API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.costruzionedigitale.com';

// Interfacce TypeScript
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
    // ✅ SOLO lettura dallo stato, nessuna richiesta API
    const status = botControlStates.get(conversationId) || { isPaused: false };
    
    return (
      <div className="flex items-center text-xs">
        <div className={`w-2 h-2 rounded-full mr-2 ${
          status.isPaused ? 'bg-orange-500' : 'bg-green-500'
        }`}></div>
        <span className={status.isPaused ? 'text-orange-400' : 'text-green-400'}>
          Bot {status.isPaused ? 'In Pausa' : 'Attivo'}
        </span>
      </div>
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
      <button
        onClick={onResumeBot}
        disabled={isResponding}
        className="p-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 transition-colors"
        title="Riattiva Bot Automatico"
      >
        <Play size={16} />
      </button>
    );
  } else {
    return (
      <button
        onClick={onPauseBot}
        disabled={isResponding}
        className="p-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-600 transition-colors"
        title="Metti in Pausa Bot (Gestione Manuale)"
      >
        <Pause size={16} />
      </button>
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
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      
      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 z-10">
          <div className="p-1">
            {status.isPaused ? (
              <button
                onClick={() => {
                  onResumeBot();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-zinc-700 rounded flex items-center"
              >
                <Play size={14} className="mr-2" />
                Riattiva Bot
              </button>
            ) : (
              <button
                onClick={() => {
                  onPauseBot();
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:bg-zinc-700 rounded flex items-center"
              >
                <Pause size={14} className="mr-2" />
                Gestione Manuale
              </button>
            )}
            <button
              onClick={() => setShowMenu(false)}
              className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-700 rounded flex items-center"
            >
              <Calendar size={14} className="mr-2" />
              Pianifica Follow-up
            </button>
          </div>
        </div>
      )}
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

  // Nuovi state per controllo bot
  const [botControlStates, setBotControlStates] = useState<Map<string, any>>(new Map());
  const [showBotControlModal, setShowBotControlModal] = useState<boolean>(false);
  const [botControlAction, setBotControlAction] = useState<'pause' | 'resume' | null>(null);
  const [pauseReason, setPauseReason] = useState<string>('');

  // Fetch configurazione utente
  useEffect(() => {
    fetchUserConfig();
  }, []);

  // Fetch conversazioni e test connessione
  useEffect(() => {
    if (config && config.whatsapp_access_token) {
      testWhatsAppConnection();
      fetchConversations();
      fetchWhatsAppStats();
      
      // ✅ NUOVA funzione combinata per fetch tutto
      const fetchAllData = async () => {
        if (loading || isFetchingBotStates) {
          console.log('⏭️ Skipping auto-refresh - already loading');
          return;
        }
        
        console.log('🔄 Auto-refresh (conversazioni + stati bot)');
        
        // Fetch conversazioni e stats
        await Promise.all([
          fetchConversations(),
          fetchWhatsAppStats()
        ]);
        
        // Fetch stati bot solo se necessario
        await fetchBotStatesForVisibleConversations();
      };
      
      // Auto-refresh ogni 30 secondi MA con logica intelligente
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [config, statusFilter, loading, isFetchingBotStates]);

  const fetchBotStatesForVisibleConversations = async (): Promise<void> => {
      // Evita richieste troppo frequenti (max 1 ogni 10 secondi)
      const now = Date.now();
      if (now - lastBotStatesFetch < 10000) {
        console.log('⏭️ Skipping bot states fetch - too recent');
        return;
      }
      
      if (isFetchingBotStates) {
        console.log('⏭️ Skipping bot states fetch - already in progress');
        return;
      }
      
      const conversationsToFetch = filteredConversations
        .slice(0, 10)
        .filter(conv => !botControlStates.has(conv.conversationId));
      
      if (conversationsToFetch.length === 0) {
        console.log('✅ All bot states already cached');
        return;
      }
      
      setIsFetchingBotStates(true);
      setLastBotStatesFetch(now);
      
      console.log(`🔄 Loading bot states for ${conversationsToFetch.length} conversations`);
      
      try {
        // ✅ Carica TUTTI gli stati in parallelo
        const statePromises = conversationsToFetch.map(async (conversation) => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/whatsapp/bot-status/${conversation.conversationId}`, {
              credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
              return {
                conversationId: conversation.conversationId,
                status: data.data.botControl || { isPaused: false }
              };
            }
          } catch (error) {
            console.error(`❌ Error fetching bot status for ${conversation.conversationId}:`, error);
          }
          
          return {
            conversationId: conversation.conversationId,
            status: { isPaused: false }
          };
        });
        
        // ✅ Aspetta TUTTE le risposte
        const results = await Promise.allSettled(statePromises);
        
        // ✅ Aggiorna la mappa UNA SOLA VOLTA
        setBotControlStates(prev => {
          const newMap = new Map(prev);
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
              newMap.set(result.value.conversationId, result.value.status);
            }
          });
          return newMap;
        });
        
        console.log(`✅ Bot states loaded for ${conversationsToFetch.length} conversations`);
        
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
      }
    } catch (error) {
      console.error('Errore fetch dettagli conversazione:', error);
    }
  };

  // Funzioni controllo bot
  const getBotControlStatus = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/bot-status/${conversationId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setBotControlStates(prev => new Map(prev.set(conversationId, data.data.botControl)));
        return data.data.botControl;
      }
    } catch (error) {
      console.error('Errore recupero stato bot:', error);
    }
    return { isPaused: false };
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

  if (!config?.whatsapp_access_token) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <MessageCircle size={48} className="mx-auto mb-4 text-zinc-600" />
          <h2 className="text-xl font-semibold mb-2">Configurazione WhatsApp mancante</h2>
          <p>Configura WhatsApp Business API nelle impostazioni per utilizzare questa funzione.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Dashboard delle statistiche */}
      {showStats && whatsappStats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="p-4 bg-zinc-800 border-b border-zinc-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Statistiche WhatsApp</h2>
            <button
              onClick={() => setShowStats(false)}
              className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-zinc-700 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Conversazioni Totali</div>
              <div className="text-2xl font-bold text-white">{whatsappStats.totalConversations}</div>
            </div>
            <div className="bg-zinc-700 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Attive</div>
              <div className="text-2xl font-bold text-green-400">{whatsappStats.activeConversations}</div>
            </div>
            <div className="bg-zinc-700 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Completate</div>
              <div className="text-2xl font-bold text-blue-400">{whatsappStats.completedConversations}</div>
            </div>
            <div className="bg-zinc-700 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Bot in Pausa</div>
              <div className="text-2xl font-bold text-orange-400">
                {Array.from(botControlStates.values()).filter(state => state.isPaused).length}
              </div>
            </div>
            <div className="bg-zinc-700 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Messaggi Totali</div>
              <div className="text-2xl font-bold text-white">{whatsappStats.totalMessages}</div>
            </div>
            <div className="bg-zinc-700 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Conversion Rate</div>
              <div className="text-2xl font-bold text-purple-400">{whatsappStats.conversionRate}%</div>
            </div>
          </div>

          {/* Lista conversazioni in pausa */}
          {Array.from(botControlStates.entries()).filter(([_, state]) => state.isPaused).length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Conversazioni in Gestione Manuale:</h3>
              <div className="space-y-1">
                {Array.from(botControlStates.entries())
                  .filter(([_, state]) => state.isPaused)
                  .slice(0, 3)
                  .map(([conversationId, state]) => {
                    const conv = filteredConversations.find(c => c.conversationId === conversationId);
                    return (
                      <div key={conversationId} className="text-xs text-orange-300 bg-orange-900/20 rounded px-2 py-1">
                        {conv?.cliente.nome || 'Utente'} - In pausa da: {state.pausedBy}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="flex h-screen">
        {/* Sidebar - Lista conversazioni */}
        <div className="w-1/3 border-r border-zinc-800 flex flex-col">
          {/* Header sidebar */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold flex items-center">
                <MessageCircle className="mr-2 text-green-400" size={24} />
                WhatsApp Chats
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="p-2 rounded-lg bg-green-600 hover:bg-green-500 transition-colors"
                  title="Nuova Conversazione"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
                  title="Mostra/Nascondi Statistiche"
                >
                  <BarChart size={16} />
                </button>
                <button
                  onClick={fetchConversations}
                  disabled={loading}
                  className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Stato connessione */}
            <div className="flex items-center mb-3 text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${getConnectionStatusColor(connectionStatus).replace('text-', 'bg-')}`}></div>
              <span className={getConnectionStatusColor(connectionStatus)}>
                {getConnectionStatusLabel(connectionStatus)}
              </span>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cerca conversazioni..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full p-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="active">Attive</option>
              <option value="completed">Completate</option>
              <option value="abandoned">Abbandonate</option>
            </select>
          </div>

          {/* Lista conversazioni */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-zinc-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                Caricamento conversazioni...
              </div>
            ) : (
              <AnimatePresence>
                {filteredConversations.map((conversation, index) => {
                  const botStatus = botControlStates.get(conversation.conversationId) || { isPaused: false };
                  
                  return (
                    <motion.div
                      key={conversation.conversationId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        fetchConversationDetails(conversation.conversationId);
                      }}
                      className={`p-4 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors ${
                        selectedConversation?.conversation.conversationId === conversation.conversationId 
                          ? 'bg-zinc-800 border-l-4 border-green-400' 
                          : ''
                      } ${botStatus.isPaused ? 'border-l-4 border-l-orange-500' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <User size={16} className="mr-2 text-zinc-400" />
                            <span className="font-medium text-sm">
                              {conversation.cliente.nome || conversation.cliente.contactName || 'Utente'}
                            </span>
                            
                            {/* Indicatore stato bot */}
                            {botStatus.isPaused && (
                              <div className="ml-2 flex items-center">
                                <Pause size={12} className="text-orange-400 mr-1" />
                                <span className="text-xs text-orange-400 font-medium">MANUALE</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-zinc-400 mb-2">
                            <Phone size={12} className="mr-1" />
                            {conversation.cliente.telefono}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${getStatusColor(conversation.status)}`}>
                              {getStatusLabel(conversation.status)}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {formatTime(conversation.lastActivity)}
                            </span>
                          </div>
                          
                          {/* Info aggiuntive se bot in pausa */}
                          {botStatus.isPaused && botStatus.pausedBy && (
                            <div className="mt-2 text-xs text-orange-300 bg-orange-900/20 rounded px-2 py-1">
                              In pausa da: {botStatus.pausedBy}
                              {botStatus.pauseReason && (
                                <div className="text-orange-400">{botStatus.pauseReason}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
            
            {!loading && filteredConversations.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                <MessageCircle size={48} className="mx-auto mb-4 text-zinc-600" />
                <p>Nessuna conversazione trovata</p>
              </div>
            )}
          </div>
        </div>

        {/* Main content - Chat details */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header chat con controlli bot */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
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
                  </div>
                  <div className="flex items-center space-x-2">
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
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedConversation.conversation.status)}`}>
                      {getStatusLabel(selectedConversation.conversation.status)}
                    </span>
                    
                    <ConversationActionsMenu
                      conversationId={selectedConversation.conversation.conversationId}
                      botControlStates={botControlStates}
                      onPauseBot={() => {
                        setBotControlAction('pause');
                        setShowBotControlModal(true);
                      }}
                      onResumeBot={() => resumeBot(selectedConversation.conversation.conversationId)}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Nuova Conversazione */}
              {showNewChatModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowNewChatModal(false);
                    }
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Nuova Conversazione</h2>
                      <button
                        onClick={() => setShowNewChatModal(false)}
                        className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Numero di Telefono *
                        </label>
                        <input
                          type="tel"
                          placeholder="+39 123 456 7890 o 0123456789"
                          className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Nome (opzionale)
                        </label>
                        <input
                          type="text"
                          placeholder="Nome del contatto"
                          className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={newChatName}
                          onChange={(e) => setNewChatName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              startNewConversation();
                            }
                          }}
                        />
                      </div>
                      
                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={() => setShowNewChatModal(false)}
                          className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                        >
                          Annulla
                        </button>
                        <button
                          onClick={startNewConversation}
                          disabled={!newChatPhone.trim() || isResponding}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center"
                        >
                          {isResponding ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            'Inizia Chat'
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Modal per controllo bot */}
              {showBotControlModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowBotControlModal(false);
                    }
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">
                        {botControlAction === 'pause' ? 'Metti in Pausa Bot' : 'Riattiva Bot'}
                      </h2>
                      <button
                        onClick={() => setShowBotControlModal(false)}
                        className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    {botControlAction === 'pause' ? (
                      <div className="space-y-4">
                        <div className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-3">
                          <div className="flex items-start">
                            <AlertTriangle size={16} className="text-orange-400 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="text-orange-200 font-medium mb-1">Gestione Manuale</p>
                              <p className="text-orange-300">
                                Il bot smetterà di rispondere automaticamente. Dovrai gestire manualmente i messaggi di questo cliente.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Motivo (opzionale)
                          </label>
                          <input
                            type="text"
                            placeholder="es: Cliente VIP, richieste complesse, follow-up personalizzato..."
                            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            value={pauseReason}
                            onChange={(e) => setPauseReason(e.target.value)}
                          />
                        </div>
                        
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={() => setShowBotControlModal(false)}
                            className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                          >
                            Annulla
                          </button>
                          <button
                            onClick={() => {
                              if (selectedConversation) {
                                pauseBot(selectedConversation.conversation.conversationId, pauseReason);
                              }
                            }}
                            disabled={isResponding}
                            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center"
                          >
                            {isResponding ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              'Metti in Pausa'
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-zinc-300">
                          Vuoi riattivare il bot automatico per questa conversazione?
                        </p>
                        
                        <div className="flex space-x-3 pt-4">
                          <button
                            onClick={() => setShowBotControlModal(false)}
                            className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
                          >
                            Annulla
                          </button>
                          <button
                            onClick={() => {
                              if (selectedConversation) {
                                resumeBot(selectedConversation.conversation.conversationId);
                              }
                            }}
                            disabled={isResponding}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            Riattiva Bot
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}

              {/* Messaggi */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message, index) => (
                  <motion.div
                    key={`${message.messageId || index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-zinc-700 text-white' 
                        : 'bg-green-600 text-white'
                    }`}>
                      <div className="flex items-start space-x-2">
                        {message.role === 'user' ? (
                          <User size={16} className="mt-1 text-zinc-400" />
                        ) : (
                          <Bot size={16} className="mt-1 text-green-200" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.role === 'assistant' && (
                              <CheckCheck size={12} className={message.delivered ? 'text-green-200' : 'text-zinc-400'} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input messaggio */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-800/50">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Scrivi un messaggio..."
                    className="flex-1 px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isResponding}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isResponding}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center"
                  >
                    {isResponding ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <MessageCircle size={64} className="mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl font-medium mb-2">Seleziona una conversazione</h3>
                <p>Scegli una conversazione dalla lista per iniziare a chattare</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChats;