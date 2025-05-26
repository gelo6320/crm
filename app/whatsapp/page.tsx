import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  BarChart
} from 'lucide-react';

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
      // Auto-refresh ogni 30 secondi
      const interval = setInterval(() => {
        fetchConversations();
        fetchWhatsAppStats();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [config, statusFilter]);

  // Scroll ai messaggi più recenti
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserConfig = async (): Promise<void> => {
    try {
      const response = await fetch('/api/user/config', {
        credentials: 'include'
      });
      const data: ApiResponse<UserConfig> = await response.json();
      
      if (data.success) {
        setConfig(data.data || null);
      } else {
        console.error('Errore recupero configurazione:', data.message);
      }
    } catch (error) {
      console.error('Errore fetch configurazione:', error);
    }
  };

  const testWhatsAppConnection = async (): Promise<void> => {
    try {
      setConnectionStatus('checking');
      const response = await fetch('/api/whatsapp/test-connection', {
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
      const response = await fetch('/api/whatsapp/stats', {
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
      
      const response = await fetch(`/api/chat/conversations?${params}`, {
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
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
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

  const sendMessage = async (): Promise<void> => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      setIsResponding(true);
      
      // Invia messaggio tramite endpoint backend
      const response = await fetch('/api/whatsapp/send-message', {
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
        // Aggiungi messaggio localmente per feedback immediato
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
        
        // Refresh conversazione dopo l'invio
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

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchTerm || 
      conv.cliente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.cliente.telefono?.includes(searchTerm) ||
      conv.conversationId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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
              <div className="text-sm text-zinc-400">Messaggi Totali</div>
              <div className="text-2xl font-bold text-white">{whatsappStats.totalMessages}</div>
            </div>
            <div className="bg-zinc-700 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Tempo Risposta</div>
              <div className="text-2xl font-bold text-yellow-400">{whatsappStats.avgResponseTime}ms</div>
            </div>
            <div className="bg-zinc-700 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Conversion Rate</div>
              <div className="text-2xl font-bold text-purple-400">{whatsappStats.conversionRate}%</div>
            </div>
          </div>
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
                {filteredConversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.conversationId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => fetchConversationDetails(conversation.conversationId)}
                    className={`p-4 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors ${
                      selectedConversation?.conversation.conversationId === conversation.conversationId 
                        ? 'bg-zinc-800 border-l-4 border-green-400' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <User size={16} className="mr-2 text-zinc-400" />
                          <span className="font-medium text-sm">
                            {conversation.cliente.nome || conversation.cliente.contactName || 'Utente'}
                          </span>
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
                      </div>
                    </div>
                  </motion.div>
                ))}
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
              {/* Header chat */}
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedConversation.conversation.status)}`}>
                      {getStatusLabel(selectedConversation.conversation.status)}
                    </span>
                    <button className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>

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