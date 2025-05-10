// components/tracciamento/flow-nodes/NavigationNode.tsx - Ottimizzato
import { Handle, Position } from 'reactflow';
import { ArrowUp, Clock, Eye, XCircle, Timer, Calendar } from 'lucide-react';
import { formatTime } from '@/lib/utils/format';

interface NavigationNodeProps {
  data: {
    label: string;
    detail: {
      type: string;
      data: Record<string, any>;
      timestamp: string;
    }
  };
  isConnectable: boolean;
}

export default function NavigationNode({ data, isConnectable }: NavigationNodeProps) {
  // Determina il tipo di evento di navigazione
  const getNavigationType = () => {
    if (data.detail.type === 'scroll' || 
        data.detail.type === 'time_on_page' || 
        data.detail.type === 'exit_intent') {
      return data.detail.type;
    }
    
    if (data.detail.data?.name) {
      if (data.detail.data.name.includes('scroll')) return 'scroll';
      if (data.detail.data.name.includes('time_on_page')) return 'time_on_page';
      if (data.detail.data.name.includes('exit_intent')) return 'exit_intent';
      if (data.detail.data.name === 'page_visibility') return 'page_visibility';
      if (data.detail.data.name === 'session_end') return 'session_end';
    }
    
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
    
    return 'generic_navigation';
  };

  const navigationType = getNavigationType();

  const getNavigationIcon = () => {
    switch (navigationType) {
      case 'scroll':
        return <ArrowUp size={14} className="text-green-500 flex-shrink-0" />;
      case 'time_on_page':
        return <Clock size={14} className="text-green-500 flex-shrink-0" />;
      case 'exit_intent':
        return <XCircle size={14} className="text-green-500 flex-shrink-0" />;
      case 'page_visibility':
        return <Eye size={14} className="text-green-500 flex-shrink-0" />;
      case 'session_end':
        return <Timer size={14} className="text-green-500 flex-shrink-0" />;
      default:
        return <ArrowUp size={14} className="text-green-500 flex-shrink-0" />;
    }
  };

  const getNavigationTypeLabel = () => {
    switch (navigationType) {
      case 'scroll': return 'Scroll';
      case 'time_on_page': return 'Tempo';
      case 'exit_intent': return 'Exit';
      case 'page_visibility': return 'Visibilità';
      case 'session_end': return 'Fine';
      default: return 'Navigazione';
    }
  };
  
  // Ottieni l'etichetta principale (seconda riga del label)
  const mainLabel = data.label.split('\n')[1] || data.label;
  
  // Ottieni il tempo formattato
  const getFormattedTime = (): string => {
    try {
      const date = new Date(data.detail.timestamp);
      return date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };
  
  // Ottieni i dettagli più importanti
  const getNavigationDetails = () => {
    switch (navigationType) {
      case 'scroll': {
        const depth = data.detail.data?.depth || 
                      data.detail.data?.percent || 
                      (data.detail.data?.data?.depth) || 
                      (data.detail.data?.data?.percent);
        return depth ? `${depth}%` : null;
      }
      
      case 'time_on_page': {
        const seconds = data.detail.data?.timeOnPage || 
                       data.detail.data?.seconds || 
                       data.detail.data?.duration ||
                       (data.detail.data?.data?.timeOnPage) || 
                       (data.detail.data?.data?.seconds);
        return seconds ? formatTime(seconds) : null;
      }
      
      case 'page_visibility': {
        const isVisible = data.detail.data?.visible !== undefined ? 
                         data.detail.data.visible : 
                         (data.detail.data?.data?.visible);
        return isVisible !== undefined ? (isVisible ? 'Visibile' : 'Nascosta') : null;
      }
      
      case 'session_end': {
        const pageViews = data.detail.data?.pageViews || 
                         (data.detail.data?.data?.pageViews);
        return pageViews ? `${pageViews} pagine` : null;
      }
      
      default:
        return null;
    }
  };
  
  const navigationDetails = getNavigationDetails();

  return (
    <div className="relative bg-green-500/20 border border-green-500 rounded-lg overflow-hidden min-w-[180px] max-w-[240px]">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-green-500 !border-green-500"
      />
      
      {/* Header */}
      <div className="flex items-center gap-2 p-2 bg-green-500/10">
        {getNavigationIcon()}
        <span className="text-xs font-medium text-white">{getNavigationTypeLabel()}</span>
        <span className="text-xs text-zinc-400 ml-auto">{getFormattedTime()}</span>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <div className="font-medium text-sm text-white mb-1 line-clamp-2 break-words" title={mainLabel}>
          {mainLabel}
        </div>
        
        {navigationDetails && (
          <div className="text-xs text-zinc-400 truncate" title={navigationDetails}>
            {navigationDetails}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-green-500 !border-green-500"
      />
    </div>
  );
}