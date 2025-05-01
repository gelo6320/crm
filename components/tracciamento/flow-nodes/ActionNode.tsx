// components/tracciamento/flow-nodes/ActionNode.tsx
import { Handle, Position } from 'reactflow';
import { MousePointer, ArrowUp, FileText } from 'lucide-react';

interface ActionNodeProps {
  data: {
    label: string;
    detail: {
      type: string;
      data: Record<string, any>;
    }
  };
  isConnectable: boolean;
}

export default function ActionNode({ data, isConnectable }: ActionNodeProps) {
  const getActionIcon = () => {
    switch (data.detail.type) {
      case 'click':
        return <MousePointer size={14} className="mr-2 text-info" />;
      case 'scroll':
        return <ArrowUp size={14} className="mr-2 text-info" />;
      case 'form_submit':
        return <FileText size={14} className="mr-2 text-info" />;
      default:
        return <MousePointer size={14} className="mr-2 text-info" />;
    }
  };

  const getActionTypeLabel = () => {
    if (data.detail.type === 'click') {
      if (data.detail.data?.formId) return 'Click Form';
      if (data.detail.data?.isNavigation) return 'Click Navigazione';
      return 'Click';
    }
    
    switch (data.detail.type) {
      case 'scroll':
        return 'Scroll';
      case 'form_submit':
        return 'Form Inviato';
      default:
        return data.detail.type;
    }
  };
  
  // Ottieni l'etichetta principale (seconda riga del label)
  const mainLabel = data.label.split('\n')[1] || data.label;

  return (
    <div className="p-3 rounded-md min-w-[200px] bg-info/20 border border-info text-white">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-info"
      />
      
      <div className="flex items-center mb-1">
        {getActionIcon()}
        <span className="text-xs font-medium text-white">{getActionTypeLabel()}</span>
      </div>
      
      <div className="font-medium text-sm truncate text-white" title={mainLabel}>
        {mainLabel}
      </div>
      
      {data.detail.type === 'click' && data.detail.data?.selector && (
        <div className="text-xs text-white mt-1 truncate" title={data.detail.data.selector}>
          {data.detail.data.selector.length > 25 
            ? data.detail.data.selector.substring(0, 25) + '...' 
            : data.detail.data.selector}
        </div>
      )}
      
      {data.detail.type === 'scroll' && data.detail.data?.depth && (
        <div className="text-xs text-white mt-1">
          Profondità: {data.detail.data.depth}%
        </div>
      )}
      
      {data.detail.type === 'form_submit' && data.detail.data?.formId && (
        <div className="text-xs text-white mt-1">
          Form ID: {data.detail.data.formId}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-info"
      />
    </div>
  );
}