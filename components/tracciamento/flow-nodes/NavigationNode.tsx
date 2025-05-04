// components/tracciamento/flow-nodes/NavigationNode.tsx
import { Handle, Position } from 'reactflow';
import { ArrowUp, Clock, MousePointer } from 'lucide-react';
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
  const getNavigationIcon = () => {
    switch (data.detail.type) {
      case 'scroll':
        return <ArrowUp size={14} className="mr-2 text-success" />;
      case 'time_on_page':
        return <Clock size={14} className="mr-2 text-success" />;
      case 'exit_intent':
        return <MousePointer size={14} className="mr-2 text-success" />;
      default:
        return <MousePointer size={14} className="mr-2 text-success" />;
    }
  };

  const getNavigationTypeLabel = () => {
    switch (data.detail.type) {
      case 'scroll':
        return 'Scroll Pagina';
      case 'time_on_page':
        return 'Tempo sulla Pagina';
      case 'exit_intent':
        return 'Exit Intent';
      default:
        return 'Navigazione';
    }
  };
  
  // Ottieni l'etichetta principale (seconda riga del label)
  const mainLabel = data.label.split('\n')[1] || data.label;

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
      
      {data.detail.type === 'scroll' && data.detail.data?.depth && (
        <div className="text-xs text-white mt-1">
          Profondità: {data.detail.data.depth}%
        </div>
      )}
      
      {data.detail.type === 'time_on_page' && data.detail.data?.duration && (
        <div className="text-xs text-white mt-1">
          Durata: {formatTime(data.detail.data.duration)}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-success"
      />
    </div>
  );
}