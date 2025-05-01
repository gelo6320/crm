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
        type?: string; // Aggiungiamo la proprietà type come opzionale
      }
    }
  };
  isConnectable: boolean;
}

export default function EventNode({ data, isConnectable }: EventNodeProps) {
  // Ottieni l'etichetta specifica per il tipo di evento di conversione
  const getEventTypeLabel = () => {
    if (data.detail.data?.name?.includes('exit_intent')) {
      return 'Exit Intent';
    }
    if (data.detail.data?.name?.includes('conversion')) {
      // Verifichiamo se type esiste prima di usarlo
      const conversionType = data.detail.data.type || '';
      return `Conversione: ${conversionType}`;
    }
    return 'Evento di Conversione';
  };
  
  // Ottieni l'etichetta principale (seconda riga del label)
  const mainLabel = data.label.split('\n')[1] || data.label;

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
        <span className="text-xs font-medium text-white">{getEventTypeLabel()}</span>
      </div>
      
      <div className="font-medium text-sm truncate text-white" title={mainLabel}>
        {mainLabel}
      </div>
      
      {data.detail.data?.category && (
        <div className="text-xs text-white mt-1 truncate">
          Categoria: {data.detail.data.category}
        </div>
      )}
      
      {data.detail.data?.value && (
        <div className="text-xs text-white mt-1 truncate">
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