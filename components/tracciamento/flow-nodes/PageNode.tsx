// components/tracciamento/flow-nodes/PageNode.tsx
import { Handle, Position } from 'reactflow';
import { Eye, Globe, Link, Calendar } from 'lucide-react';

interface PageNodeProps {
  data: {
    label: string;
    detail: {
      data: Record<string, any>;
      timestamp: string;
    }
  };
  isConnectable: boolean;
}

export default function PageNode({ data, isConnectable }: PageNodeProps) {
  // Estrai l'URL e il titolo in modo sicuro
  const url = data.detail.data?.url || '';
  const title = data.detail.data?.title || 'Pagina senza titolo';
  const referrer = data.detail.data?.referrer || '';
  
  // Estrai il pathname dall'URL in modo sicuro
  const getPathname = (url: string): string => {
    try {
      return new URL(url).pathname;
    } catch (e) {
      return url;
    }
  };
  
  // Crea un'etichetta più compatta per l'URL
  const displayUrl = url.length > 40 ? url.substring(0, 37) + '...' : url;
  
  // Ottieni il tempo formattato
  const getFormattedTime = (): string => {
    try {
      const date = new Date(data.detail.timestamp);
      return date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="p-3 rounded-md min-w-[200px] bg-primary/20 border border-primary text-white">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-primary"
      />
      
      <div className="flex items-center mb-1">
        <Eye size={14} className="mr-2 text-primary" />
        <span className="text-xs font-medium text-white">Visualizzazione Pagina</span>
      </div>
      
      <div className="font-medium text-sm truncate text-white" title={title}>
        {title}
      </div>
      
      <div className="text-xs text-white mt-1 flex items-center" title={url}>
        <Globe size={12} className="mr-1 text-zinc-400" />
        <span className="truncate">{displayUrl}</span>
      </div>
      
      {referrer && (
        <div className="text-xs text-white mt-1 flex items-center" title={`Referrer: ${referrer}`}>
          <Link size={12} className="mr-1 text-zinc-400" />
          <span className="truncate">
            {referrer.length > 30 ? referrer.substring(0, 27) + '...' : referrer}
          </span>
        </div>
      )}
      
      <div className="text-xs text-zinc-400 mt-1 flex items-center">
        <Calendar size={12} className="mr-1 text-zinc-500" />
        <span>{getFormattedTime()}</span>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-primary"
      />
    </div>
  );
}