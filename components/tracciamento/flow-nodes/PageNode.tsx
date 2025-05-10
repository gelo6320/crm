// components/tracciamento/flow-nodes/PageNode.tsx - Ottimizzato
import { Handle, Position } from 'reactflow';
import { Eye, Calendar } from 'lucide-react';

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
  
  // Estrai il dominio dall'URL
  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  };
  
  // Crea un'etichetta compatta per l'URL
  const displayUrl = getDomain(url) || url;
  
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
  
  return (
    <div className="relative bg-orange-500/20 border border-orange-500 rounded-lg overflow-hidden min-w-[180px] max-w-[240px]">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-orange-500 !border-orange-500"
      />
      
      {/* Header */}
      <div className="flex items-center gap-2 p-2 bg-orange-500/10">
        <Eye size={14} className="text-orange-500 flex-shrink-0" />
        <span className="text-xs font-medium text-white">Pagina</span>
        <span className="text-xs text-zinc-400 ml-auto">{getFormattedTime()}</span>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <div className="font-medium text-sm text-white mb-1 line-clamp-2 break-words" title={title}>
          {title}
        </div>
        
        <div className="text-xs text-zinc-400 truncate" title={url}>
          {displayUrl}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-orange-500 !border-orange-500"
      />
    </div>
  );
}