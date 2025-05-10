// components/tracciamento/flow-nodes/ActionNode.tsx - Ottimizzato
import { Handle, Position } from 'reactflow';
import { MousePointer, FileText, Mail, ArrowUp, Calendar } from 'lucide-react';

interface ActionNodeProps {
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

export default function ActionNode({ data, isConnectable }: ActionNodeProps) {
  const getActionIcon = () => {
    switch (data.detail.type) {
      case 'click':
        return <MousePointer size={14} className="text-blue-500 flex-shrink-0" />;
      case 'scroll':
        return <ArrowUp size={14} className="text-blue-500 flex-shrink-0" />;
      case 'form_submit':
        return <FileText size={14} className="text-blue-500 flex-shrink-0" />;
      default:
        // Per eventi generici
        if (data.detail.type === 'event') {
          if (data.detail.data?.name === 'generic_click' || data.detail.data?.tagName) {
            return <MousePointer size={14} className="text-blue-500 flex-shrink-0" />;
          }
          if (data.detail.data?.fieldName === 'email') {
            return <Mail size={14} className="text-blue-500 flex-shrink-0" />;
          }
        }
        return <MousePointer size={14} className="text-blue-500 flex-shrink-0" />;
    }
  };

  const getActionType = () => {
    if (data.detail.type === 'event' && data.detail.data?.name === 'generic_click') {
      return 'Click';
    }
    if (data.detail.type === 'event' && data.detail.data?.fieldName === 'email') {
      return 'Email';
    }
    if (data.detail.type === 'event' && data.detail.data?.tagName) {
      return 'Click';
    }
    
    switch (data.detail.type) {
      case 'click': return 'Click';
      case 'scroll': return 'Scroll';
      case 'form_submit': return 'Form';
      default: return 'Azione';
    }
  };
  
  // Ottieni l'etichetta principale (seconda riga del label)
  const mainLabel = data.label.split('\n')[1] || data.label;
  
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
  
  // Estrai i dettagli più importanti in base al tipo
  const getActionDetails = () => {
    // Click generici
    if (data.detail.type === 'event' && data.detail.data?.name === 'generic_click') {
      return data.detail.data?.text || data.detail.data?.id || null;
    }
    
    // Email
    if (data.detail.type === 'event' && data.detail.data?.fieldName === 'email') {
      return data.detail.data?.form || 'Form';
    }
    
    // Click standard
    if (data.detail.type === 'click') {
      return data.detail.data?.text || data.detail.data?.element || null;
    }
    
    // Scroll
    if (data.detail.type === 'scroll') {
      return `${data.detail.data?.depth || 0}%`;
    }
    
    return null;
  };
  
  const actionDetails = getActionDetails();
  
  return (
    <div className="relative bg-blue-500/20 border border-blue-500 rounded-lg overflow-hidden min-w-[180px] max-w-[240px]">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-blue-500 !border-blue-500"
      />
      
      {/* Header */}
      <div className="flex items-center gap-2 p-2 bg-blue-500/10">
        {getActionIcon()}
        <span className="text-xs font-medium text-white">{getActionType()}</span>
        <span className="text-xs text-zinc-400 ml-auto">{getFormattedTime()}</span>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <div className="font-medium text-sm text-white mb-1 line-clamp-2 break-words" title={mainLabel}>
          {mainLabel}
        </div>
        
        {actionDetails && (
          <div className="text-xs text-zinc-400 truncate" title={actionDetails}>
            {actionDetails}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-blue-500 !border-blue-500"
      />
    </div>
  );
}