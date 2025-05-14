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
  // Determine navigation type based on event data
  const getNavigationType = () => {
    const type = data.detail.type;
    
    // Caso specifico per scroll_bottom
    if (type === 'scroll_bottom' || 
        (type === 'event' && data.detail.data?.name === 'scroll_bottom')) {
      return 'scroll_bottom';
    }
    
    // Check for direct type matches first
    if (type === 'scroll' || type === 'time_on_page' || type === 'exit_intent') {
      return type;
    }
    
    // Check for event names that indicate type
    if (type === 'event' && data.detail.data?.name) {
      if (data.detail.data.name.includes('scroll')) return 'scroll';
      if (data.detail.data.name.includes('time_on_page')) return 'time_on_page';
      if (data.detail.data.name.includes('exit_intent')) return 'exit_intent';
      if (data.detail.data.name === 'page_visibility') return 'page_visibility';
      if (data.detail.data.name === 'session_end') return 'session_end';
    }

    // Check for specific properties that indicate the navigation type
    if (data.detail.data?.scrollDepth !== undefined || 
        data.detail.data?.scrollPercentage !== undefined ||
        data.detail.data?.depth !== undefined ||
        data.detail.data?.percent !== undefined) {
      return 'scroll';
    }
    
    if (data.detail.data?.isVisible !== undefined) {
      return 'page_visibility';
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
      if (data.detail.data?.scrollPercentage) {
        return data.detail.data.scrollPercentage;
      }
      
      // Then check various possible scroll data locations
      const depth = 
        data.detail.data?.scrollDepth || 
        data.detail.data?.depth || 
        data.detail.data?.percent || 
        (data.detail.data?.raw?.depth) || 
        (data.detail.data?.raw?.percent) || 
        0;
      
      // Format as percentage
      return `${depth}%`;
    }
    
    if (navigationType === 'scroll_bottom') {
      return '100%';
    }
    
    if (navigationType === 'time_on_page') {
      const seconds = 
        data.detail.data?.timeOnPage || 
        data.detail.data?.seconds || 
        data.detail.data?.duration ||
        (data.detail.data?.raw?.timeOnPage) || 
        0;
      
      return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds/60)}m ${seconds%60}s`;
    }
    
    if (navigationType === 'page_visibility') {
      const isVisible = data.detail.data?.isVisible !== undefined ? 
                      data.detail.data.isVisible : 
                      data.detail.data?.visible;
      
      return isVisible ? 'Visibile' : 'Nascosta';
    }
    
    return '';
  };
  
  // Calculate if this is a significant scroll (>10%) or scroll_bottom
  const isSignificantScroll = () => {
    if (navigationType === 'scroll_bottom') return true;
    
    if (navigationType !== 'scroll') return false;
    
    const depth = 
      data.detail.data?.scrollDepth || 
      data.detail.data?.depth || 
      data.detail.data?.percent || 
      (data.detail.data?.raw?.depth) || 
      (data.detail.data?.raw?.percent) || 
      0;
    
    return depth >= 10;
  };
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden">
      {/* Header with color based on significance */}
      <div className={`${isSignificantScroll() ? 'bg-green-600' : 'bg-green-500'} px-3 py-2 flex items-center`}>
        {getNavigationIcon()}
        <span className="text-white font-medium ml-2">{getNavigationLabel()}</span>
        
        {getNavigationValue() && (
          <span className="ml-auto bg-white text-green-700 text-xs py-0.5 px-2 rounded-full font-medium">
            {getNavigationValue()}
          </span>
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
            {data.detail.data?.totalScrollDistance && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Distanza: {data.detail.data.totalScrollDistance}px
              </div>
            )}
            
            {data.detail.data?.raw?.documentHeight && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Doc: {data.detail.data.raw.documentHeight}px, Viewport: {data.detail.data.raw.viewportHeight || '?'}px
              </div>
            )}
          </>
        )}
        
        {/* Scroll Bottom details */}
        {navigationType === 'scroll_bottom' && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pagina scorsa completamente
            {data.detail.data?.raw?.totalScrollDistance && (
              <span className="ml-1">({data.detail.data.raw.totalScrollDistance}px)</span>
            )}
          </div>
        )}
        
        {/* Time on page details */}
        {navigationType === 'time_on_page' && data.detail.data?.timeOnPage && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Durata: {formatTime(data.detail.data.timeOnPage)}
          </div>
        )}
        
        {/* Page visibility details */}
        {navigationType === 'page_visibility' && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Stato: {data.detail.data?.isVisible ? 'Pagina attiva' : 'Scheda in background'}
          </div>
        )}
      </div>
      
      {/* Connection points */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-green-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-green-500" />
    </div>
  );
}