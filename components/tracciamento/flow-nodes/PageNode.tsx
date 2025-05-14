// components/tracciamento/flow-nodes/PageNode.tsx - Updated version
import { Handle, Position } from 'reactflow';
import { Eye, Globe, Link, Calendar, Clock } from 'lucide-react';

interface PageNodeProps {
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

export default function PageNode({ data, isConnectable }: PageNodeProps) {
  // Extract metadata from various locations in the object structure
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
  
  const url = getMetadata('url', '');
  const title = getMetadata('title', 'Pagina senza titolo');
  const referrer = getMetadata('referrer', '');
  const scrollDepth = getMetadata('scrollDepth') || getMetadata('percent');
  const timeOnPage = getMetadata('timeOnPage') || getMetadata('totalTimeSeconds');
  const pageType = getMetadata('pageType');
  
  // Get formatted time
  const getFormattedTime = () => {
    try {
      const date = new Date(data.detail.timestamp);
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  // Format domain from URL
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  };
  
  // Format path from URL
  const getPath = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-3 py-2 flex items-center">
        <Eye size={16} className="text-white mr-2" />
        <span className="text-white font-medium">Pagina</span>
        <span className="ml-auto text-xs text-white opacity-80">{getFormattedTime()}</span>
      </div>
      
      {/* Content */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        <div className="font-medium mb-1 text-zinc-900 dark:text-white">{title}</div>
        
        {url && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 truncate" title={url}>
            <Globe size={12} className="inline mr-1" />
            {url.length > 30 ? getDomain(url) + getPath(url).substring(0, 10) + '...' : url}
          </div>
        )}
        
        {referrer && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate" title={referrer}>
            <Link size={12} className="inline mr-1" />
            {referrer.length > 30 ? 'Da: ' + getDomain(referrer) : 'Da: ' + referrer}
          </div>
        )}
        
        {/* Page type if available */}
        {pageType && (
          <div className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">
            {pageType}
          </div>
        )}
        
        {/* Add scroll depth and time on page if available */}
        <div className="flex mt-1 gap-2">
          {scrollDepth !== undefined && (
            <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Scroll: {scrollDepth}%
            </div>
          )}
          
          {timeOnPage !== undefined && (
            <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Clock size={10} className="inline mr-1" />
              {timeOnPage}s
            </div>
          )}
        </div>
      </div>
      
      {/* Connection points */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-primary" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-primary" />
    </div>
  );
}