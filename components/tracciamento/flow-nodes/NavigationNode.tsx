// components/tracciamento/flow-nodes/NavigationNode.tsx - Updated
import { Handle, Position } from 'reactflow';
import { ArrowUp, Clock, MousePointer, Eye, XCircle, Timer, Percent } from 'lucide-react';
import { formatTime } from '@/lib/utils/format';

interface NavigationNodeProps {
  data: {
    label: string;
    detail: {
      type: string;
      data: Record<string, any>;
      timestamp?: string;
    }
  };
  isConnectable: boolean;
}

export default function NavigationNode({ data, isConnectable }: NavigationNodeProps) {
  // Helper per estrarre dati da diverse locazioni nell'oggetto
  const getMetadata = (key: string, defaultValue: any = null) => {
    // Check in data directly
    if (data.detail.data?.[key] !== undefined) {
      return data.detail.data[key];
    }
    
    // Check in metadata if exists
    if (data.detail.data?.metadata?.[key] !== undefined) {
      return data.detail.data.metadata[key];
    }
    
    // Check in raw if exists
    if (data.detail.data?.raw?.[key] !== undefined) {
      return data.detail.data.raw[key];
    }
    
    return defaultValue;
  };
  
  // Determine navigation type based on event data
  const getNavigationType = () => {
    const type = data.detail.type;
    
    // Caso specifico per scroll_bottom
    if (type === 'scroll' && getMetadata('scrollTypes') && 
        getMetadata('scrollTypes').includes('bottom')) {
      return 'scroll_bottom';
    }
    
    // Check for direct type matches first
    if (['scroll', 'time_on_page', 'exit_intent', 'page_visibility', 'session_end'].includes(type)) {
      return type;
    }
    
    // Check for event names that indicate type
    if (type === 'event' && getMetadata('name')) {
      if (getMetadata('name').includes('scroll')) return 'scroll';
      if (getMetadata('name').includes('time_on_page')) return 'time_on_page';
      if (getMetadata('name').includes('exit_intent')) return 'exit_intent';
      if (getMetadata('name') === 'page_visibility') return 'page_visibility';
      if (getMetadata('name') === 'session_end') return 'session_end';
    }

    // Check for specific properties that indicate the navigation type
    if (getMetadata('scrollDepth') !== undefined || 
        getMetadata('scrollPercentage') !== undefined ||
        getMetadata('depth') !== undefined ||
        getMetadata('percent') !== undefined) {
      return 'scroll';
    }
    
    if (getMetadata('isVisible') !== undefined) {
      return 'page_visibility';
    }
    
    if (getMetadata('totalTimeSeconds') !== undefined ||
        getMetadata('timeOnPage') !== undefined) {
      return 'time_on_page';
    }
    
    return 'generic_navigation';
  };

  const navigationType = getNavigationType();
  
  // Get appropriate icon based on navigation type
  const getNavigationIcon = () => {
    switch (navigationType) {
      case 'scroll': return <ArrowUp size={16} className="text-white" />;
      case 'scroll_bottom': return <ArrowUp size={16} className="text-white" />;
      case 'time_on_page': return <Clock size={16} className="text-white" />;
      case 'exit_intent': return <XCircle size={16} className="text-white" />;
      case 'page_visibility': return <Eye size={16} className="text-white" />;
      case 'session_end': return <Timer size={16} className="text-white" />;
      default: return <MousePointer size={16} className="text-white" />;
    }
  };

  // Get appropriate label based on navigation type
  const getNavigationLabel = () => {
    switch (navigationType) {
      case 'scroll': return 'Scroll';
      case 'scroll_bottom': return 'Fine Pagina';
      case 'time_on_page': return 'Tempo';
      case 'exit_intent': return 'Uscita';
      case 'page_visibility': return 'Visibilità';
      case 'session_end': return 'Fine';
      default: return 'Navigazione';
    }
  };
  
  // Get appropriate value based on navigation type
  const getNavigationValue = () => {
    if (navigationType === 'scroll') {
      // First check for the pre-formatted percentage from our API
      if (getMetadata('scrollPercentage')) {
        return getMetadata('scrollPercentage');
      }
      
      // Then check various possible scroll data locations
      const depth = 
        getMetadata('scrollDepth') || 
        getMetadata('depth') || 
        getMetadata('percent') || 
        0;
      
      // Format as percentage
      return `${depth}%`;
    }
    
    if (navigationType === 'scroll_bottom') {
      return '100%';
    }
    
    if (navigationType === 'time_on_page') {
      const seconds = 
        getMetadata('totalTimeSeconds') || 
        getMetadata('timeOnPage') || 
        getMetadata('seconds') || 
        getMetadata('duration') ||
        0;
      
      return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds/60)}m ${seconds%60}s`;
    }
    
    if (navigationType === 'page_visibility') {
      const isVisible = getMetadata('isVisible') !== undefined ? 
                      getMetadata('isVisible') : 
                      getMetadata('visible');
      
      return isVisible ? 'Visibile' : 'Nascosta';
    }
    
    if (navigationType === 'session_end') {
      return getMetadata('status') || 'completed';
    }
    
    return '';
  };
  
  // Calculate if this is a significant scroll (>50%) or scroll_bottom
  const isSignificantScroll = () => {
    if (navigationType === 'scroll_bottom') return true;
    
    if (navigationType !== 'scroll') return false;
    
    const depth = 
      getMetadata('scrollDepth') || 
      getMetadata('depth') || 
      getMetadata('percent') || 
      0;
    
    return depth >= 50;
  };
  
  // Get formatted time
  const getFormattedTime = () => {
    try {
      const date = data.detail.timestamp ? new Date(data.detail.timestamp) : new Date();
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden w-60">
      {/* Header with color based on significance */}
      <div className={`${isSignificantScroll() ? 'bg-green-600' : 'bg-green-500'} px-3 py-2 flex items-center`}>
        {getNavigationIcon()}
        <span className="text-white font-medium ml-2">{getNavigationLabel()}</span>
        
        {getNavigationValue() && (
          <span className="ml-auto bg-white text-green-700 text-xs py-0.5 px-2 rounded-full font-medium">
            {getNavigationValue()}
          </span>
        )}
        
        {!getNavigationValue() && (
          <span className="ml-auto text-xs text-white opacity-80">{getFormattedTime()}</span>
        )}
      </div>
      
      {/* Content with more detailed info */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        <div className="font-medium text-zinc-900 dark:text-white">
          {navigationType === 'scroll' ? 'Scorrimento Pagina' : 
          navigationType === 'scroll_bottom' ? 'Fine Pagina Raggiunta' :
          navigationType === 'time_on_page' ? 'Tempo sulla Pagina' :
          navigationType === 'exit_intent' ? 'Intenzione di Uscita' :
          navigationType === 'page_visibility' ? 'Visibilità Pagina' :
          navigationType === 'session_end' ? 'Fine Sessione' : 'Navigazione'}
        </div>
        
        {/* Scroll details */}
        {navigationType === 'scroll' && (
          <>
            {getMetadata('totalScrollDistance') && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Distanza: {getMetadata('totalScrollDistance')}px
              </div>
            )}
            
            {getMetadata('scrollTypes') && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Tipo: {getMetadata('scrollTypes').join(', ')}
              </div>
            )}
            
            {getMetadata('documentHeight') && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Doc: {getMetadata('documentHeight')}px, 
                Viewport: {getMetadata('viewportHeight') || '?'}px
              </div>
            )}
          </>
        )}
        
        {/* Time on page details */}
        {navigationType === 'time_on_page' && (
          <>
            {getMetadata('totalTimeSeconds') && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Durata: {formatTime(getMetadata('totalTimeSeconds'))}
              </div>
            )}
            
            {getMetadata('status') && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Stato: {getMetadata('status')}
              </div>
            )}
            
            {getMetadata('isActive') !== undefined && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Attivo: {getMetadata('isActive') ? 'Sì' : 'No'}
              </div>
            )}
          </>
        )}
        
        {/* Page visibility details */}
        {navigationType === 'page_visibility' && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Stato: {getMetadata('isVisible') ? 'Pagina attiva' : 'Scheda in background'}
            {getMetadata('totalVisibleTime') && (
              <div className="mt-1">
                Tempo visibile: {formatTime(Math.floor(getMetadata('totalVisibleTime')/1000))}
              </div>
            )}
          </div>
        )}
        
        {/* Session end details */}
        {navigationType === 'session_end' && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {getMetadata('totalTimeOnPage') && (
              <div>Durata sessione: {formatTime(getMetadata('totalTimeOnPage'))}</div>
            )}
            {getMetadata('events') && (
              <div className="mt-1">Eventi: {getMetadata('events')}</div>
            )}
            {getMetadata('pageViews') && (
              <div className="mt-1">Pagine viste: {getMetadata('pageViews')}</div>
            )}
          </div>
        )}
      </div>
      
      {/* Connection points */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-green-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-green-500" />
    </div>
  );
}