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
  // Determina il tipo di evento di navigazione
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
        return <ArrowUp size={14} className="mr-2 text-success" />;
      case 'time_on_page':
        return <Clock size={14} className="mr-2 text-success" />;
      case 'exit_intent':
        return <XCircle size={14} className="mr-2 text-success" />;
      case 'page_visibility':
        return <Eye size={14} className="mr-2 text-success" />;
      case 'session_end':
        return <Timer size={14} className="mr-2 text-success" />;
      default:
        return <MousePointer size={14} className="mr-2 text-success" />;
    }
  };

  // Ottieni l'etichetta appropriata in base al tipo di navigazione
  const getNavigationTypeLabel = () => {
    switch (navigationType) {
      case 'scroll':
        return 'Scroll Pagina';
      case 'time_on_page':
        return 'Tempo sulla Pagina';
      case 'exit_intent':
        return 'Exit Intent';
      case 'page_visibility':
        return 'Visibilità Pagina';
      case 'session_end':
        return 'Fine Sessione';
      default:
        return 'Navigazione';
    }
  };
  
  // Ottieni l'etichetta principale (seconda riga del label)
  const mainLabel = data.label.split('\n')[1] || data.label;

  // Estrai i dati specifici del tipo di navigazione
  const getNavigationData = () => {
    const details = [];
    
    // Dati di scroll
    if (navigationType === 'scroll') {
      const depth = data.detail.data?.depth || 
                   data.detail.data?.percent || 
                   (data.detail.data?.data?.depth) || 
                   (data.detail.data?.data?.percent);
      
      if (depth !== undefined) {
        details.push(
          <div key="depth" className="text-xs text-white mt-1 flex items-center">
            <Percent size={12} className="mr-1" />
            <span>Profondità: {depth}%</span>
          </div>
        );
      }
      
      const totalDistance = data.detail.data?.totalScrollDistance || 
                           (data.detail.data?.data?.totalScrollDistance);
                           
      if (totalDistance !== undefined) {
        details.push(
          <div key="distance" className="text-xs text-white mt-1">
            Distanza: {totalDistance}px
          </div>
        );
      }
    }
    
    // Dati di tempo sulla pagina
    else if (navigationType === 'time_on_page') {
      const seconds = data.detail.data?.timeOnPage || 
                     data.detail.data?.seconds || 
                     data.detail.data?.duration ||
                     (data.detail.data?.data?.timeOnPage) || 
                     (data.detail.data?.data?.seconds);
                     
      if (seconds !== undefined) {
        details.push(
          <div key="duration" className="text-xs text-white mt-1 flex items-center">
            <Clock size={12} className="mr-1" />
            <span>Durata: {formatTime(seconds)}</span>
          </div>
        );
      }
    }
    
    // Dati di visibilità pagina
    else if (navigationType === 'page_visibility') {
      const isVisible = data.detail.data?.visible !== undefined ? 
                      data.detail.data.visible : 
                      (data.detail.data?.data?.visible);
                      
      if (isVisible !== undefined) {
        details.push(
          <div key="visibility" className="text-xs text-white mt-1">
            Stato: {isVisible ? 'Pagina visibile' : 'Pagina nascosta'}
          </div>
        );
      }
    }
    
    // Dati di fine sessione
    else if (navigationType === 'session_end') {
      const pageViews = data.detail.data?.pageViews || 
                       (data.detail.data?.data?.pageViews);
                       
      const totalTime = data.detail.data?.totalTimeOnPage || 
                       (data.detail.data?.data?.totalTimeOnPage);
                       
      if (pageViews !== undefined) {
        details.push(
          <div key="pageviews" className="text-xs text-white mt-1">
            Pagine viste: {pageViews}
          </div>
        );
      }
      
      if (totalTime !== undefined) {
        details.push(
          <div key="totaltime" className="text-xs text-white mt-1">
            Tempo totale: {formatTime(totalTime)}
          </div>
        );
      }
    }
    
    return details;
  };

  return (
    <div className="p-3 rounded-md min-w-[200px] bg-success/20 border border-success text-white">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-success"
      />
      
      <div className="flex items-center mb-1">
        {getNavigationIcon()}
        <span className="text-xs font-medium text-white">{getNavigationTypeLabel()}</span>
      </div>
      
      <div className="font-medium text-sm truncate text-white" title={mainLabel}>
        {mainLabel}
      </div>
      
      {/* Dati specifici per tipo di navigazione */}
      {getNavigationData()}
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-success"
      />
    </div>
  );
}