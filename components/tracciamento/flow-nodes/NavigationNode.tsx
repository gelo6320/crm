// components/tracciamento/flow-nodes/NavigationNode.tsx
import { Handle, Position } from 'reactflow';
import { ArrowUp, Clock, MousePointer, Eye, XCircle, Timer, Percent } from 'lucide-react';
import { formatTime } from '@/lib/utils/format';

interface NavigationNodeProps {
  data: {
    label: string;
    detail: {
      type: string;
      data: Record<string, any>;
    }
  };
  isConnectable: boolean;
}

export default function NavigationNode({ data, isConnectable }: NavigationNodeProps) {
  // Determina il tipo di navigazione
  const getNavigationType = () => {
    // Per eventi direttamente identificati come scroll, time_on_page, exit_intent
    if (data.detail.type === 'scroll' || 
        data.detail.type === 'time_on_page' || 
        data.detail.type === 'exit_intent') {
      return data.detail.type;
    }
    
    // Per eventi con name che indica il tipo
    if (data.detail.data?.name) {
      if (data.detail.data.name.includes('scroll')) return 'scroll';
      if (data.detail.data.name.includes('time_on_page')) return 'time_on_page';
      if (data.detail.data.name.includes('exit_intent')) return 'exit_intent';
      if (data.detail.data.name === 'page_visibility') return 'page_visibility';
      if (data.detail.data.name === 'session_end') return 'session_end';
    }
    
    // Per eventi con proprietà specifiche
    if (data.detail.data?.depth !== undefined || 
        data.detail.data?.totalScrollDistance !== undefined ||
        data.detail.data?.percent !== undefined) {
      return 'scroll';
    }
    
    if (data.detail.data?.timeOnPage !== undefined || 
        data.detail.data?.seconds !== undefined) {
      return 'time_on_page';
    }
    
    if (data.detail.data?.visible !== undefined) {
      return 'page_visibility';
    }
    
    // Fallback
    return 'generic_navigation';
  };

  const navigationType = getNavigationType();
  
  // Ottieni l'icona appropriata in base al tipo di navigazione
  const getNavigationIcon = () => {
    switch (navigationType) {
      case 'scroll':
        return <ArrowUp size={16} className="text-white" />;
      case 'time_on_page':
        return <Clock size={16} className="text-white" />;
      case 'exit_intent':
        return <XCircle size={16} className="text-white" />;
      case 'page_visibility':
        return <Eye size={16} className="text-white" />;
      case 'session_end':
        return <Timer size={16} className="text-white" />;
      default:
        return <MousePointer size={16} className="text-white" />;
    }
  };

  // Ottieni l'etichetta appropriata in base al tipo di navigazione
  const getNavigationLabel = () => {
    switch (navigationType) {
      case 'scroll':
        return 'Scroll';
      case 'time_on_page':
        return 'Tempo';
      case 'exit_intent':
        return 'Uscita';
      case 'page_visibility':
        return 'Visibilità';
      case 'session_end':
        return 'Fine';
      default:
        return 'Navigazione';
    }
  };
  
  // Ottieni valore pertinente
  const getNavigationValue = () => {
    if (navigationType === 'scroll') {
      const depth = data.detail.data?.depth || 
                  data.detail.data?.percent || 
                  (data.detail.data?.data?.depth) || 
                  (data.detail.data?.data?.percent) || 0;
      return `${depth}%`;
    }
    
    if (navigationType === 'time_on_page') {
      const seconds = data.detail.data?.timeOnPage || 
                    data.detail.data?.seconds || 
                    data.detail.data?.duration ||
                    (data.detail.data?.data?.timeOnPage) || 
                    (data.detail.data?.data?.seconds) || 0;
      
      return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds/60)}m ${seconds%60}s`;
    }
    
    if (navigationType === 'page_visibility') {
      const isVisible = data.detail.data?.visible !== undefined ? 
                      data.detail.data.visible : 
                      (data.detail.data?.data?.visible);
      
      return isVisible ? 'Visibile' : 'Nascosta';
    }
    
    return '';
  };
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden">
      {/* Header colorato */}
      <div className="bg-green-500 px-3 py-2 flex items-center">
        {getNavigationIcon()}
        <span className="text-white font-medium ml-2">{getNavigationLabel()}</span>
        
        {getNavigationValue() && (
          <span className="ml-auto bg-white text-green-700 text-xs py-0.5 px-2 rounded-full font-medium">
            {getNavigationValue()}
          </span>
        )}
      </div>
      
      {/* Contenuto */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        <div className="font-medium text-zinc-900 dark:text-white">
          {navigationType === 'scroll' ? 'Scorrimento Pagina' : 
          navigationType === 'time_on_page' ? 'Tempo sulla Pagina' :
          navigationType === 'exit_intent' ? 'Intenzione di Uscita' :
          navigationType === 'page_visibility' ? 'Visibilità Pagina' :
          navigationType === 'session_end' ? 'Fine Sessione' : 'Navigazione'}
        </div>
        
        {/* Aggiungi dettagli specifici del tipo di navigazione */}
        {navigationType === 'scroll' && data.detail.data?.direction && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Direzione: {data.detail.data.direction === 'up' ? 'verso l\'alto' : 'verso il basso'}
          </div>
        )}
        
        {navigationType === 'session_end' && data.detail.data?.pageViews && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pagine viste: {data.detail.data.pageViews}
          </div>
        )}
        
        {navigationType === 'session_end' && data.detail.data?.totalTimeOnPage && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Tempo totale: {formatTime(data.detail.data.totalTimeOnPage)}
          </div>
        )}
      </div>
      
      {/* Connettori */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-green-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-green-500" />
    </div>
  );
}