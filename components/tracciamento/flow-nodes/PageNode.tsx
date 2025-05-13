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
  const url = data.detail.data?.url || '';
  const title = data.detail.data?.title || 'Pagina senza titolo';
  const referrer = data.detail.data?.referrer || '';
  
  // Ottieni il tempo formattato
  const getFormattedTime = () => {
    try {
      const date = new Date(data.detail.timestamp);
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden">
      {/* Header colorato */}
      <div className="bg-primary px-3 py-2 flex items-center">
        <Eye size={16} className="text-white mr-2" />
        <span className="text-white font-medium">Pagina</span>
        <span className="ml-auto text-xs text-white opacity-80">{getFormattedTime()}</span>
      </div>
      
      {/* Contenuto */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        <div className="font-medium mb-1 text-zinc-900 dark:text-white">{title}</div>
        
        {url && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 truncate" title={url}>
            <Globe size={12} className="inline mr-1" />
            {url.length > 30 ? url.substring(0, 27) + '...' : url}
          </div>
        )}
        
        {referrer && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate" title={referrer}>
            <Link size={12} className="inline mr-1" />
            {referrer.length > 30 ? 'Da: ' + referrer.substring(0, 25) + '...' : 'Da: ' + referrer}
          </div>
        )}
      </div>
      
      {/* Connettori */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-primary" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-primary" />
    </div>
  );
}