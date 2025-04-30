// components/tracciamento/flow-nodes/EventNode.tsx
import { Handle, Position } from 'reactflow';
import { AlertCircle } from 'lucide-react';

interface EventNodeProps {
  data: {
    label: string;
    detail: {
      data: {
        name: string;
        value?: string | number;
        category?: string;
      }
    }
  };
  isConnectable: boolean;
}

export default function EventNode({ data, isConnectable }: EventNodeProps) {
  return (
    <div className="p-3 rounded-md min-w-[200px] bg-danger/20 border border-danger text-white">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-danger"
      />
      
      <div className="flex items-center mb-1">
        <AlertCircle size={14} className="mr-2 text-danger" />
        <span className="text-xs font-medium">Evento di Conversione</span>
      </div>
      
      <div className="font-medium text-sm truncate" title={data.label}>
        {data.label}
      </div>
      
      {data.detail.data.category && (
        <div className="text-xs text-zinc-300 mt-1 truncate">
          Categoria: {data.detail.data.category}
        </div>
      )}
      
      {data.detail.data.value && (
        <div className="text-xs text-zinc-300 mt-1 truncate">
          Valore: {data.detail.data.value}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-danger"
      />
    </div>
  );
}