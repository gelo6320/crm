// components/tracciamento/flow-nodes/PageNode.tsx
import { Handle, Position } from 'reactflow';
import { Eye } from 'lucide-react';

interface PageNodeProps {
  data: {
    label: string;
    detail: {
      data: {
        url: string;
        title: string;
      }
    }
  };
  isConnectable: boolean;
}

export default function PageNode({ data, isConnectable }: PageNodeProps) {
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
      
      <div className="font-medium text-sm truncate text-white" title={data.label}>
        {data.label.split('\n')[1] || data.label}
      </div>
      
      <div className="text-xs text-white mt-1 truncate" title={data.detail.data?.url}>
        {data.detail.data?.url || 'N/D'}
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