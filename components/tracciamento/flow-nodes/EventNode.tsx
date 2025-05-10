// components/tracciamento/flow-nodes/EventNode.tsx - Ottimizzato
import { Handle, Position } from 'reactflow';
import { AlertCircle, User, DollarSign, Calendar } from 'lucide-react';

interface EventNodeProps {
  data: {
    label: string;
    detail: {
      type: string;
      data: any;
      timestamp: string;
    }
  };
  isConnectable: boolean;
}

export default function EventNode({ data, isConnectable }: EventNodeProps) {
  // Determina il tipo di evento
  const getEventType = () => {
    // Lead acquisition
    if ((data.detail.data?.name && data.detail.data.name.includes('lead_acquisition')) || 
        data.detail.data?.formType) {
      return 'lead';
    }
    
    // Conversione
    if (data.detail.data?.conversionType || 
        (data.detail.data?.name && data.detail.data.name.includes('conversion')) ||
        data.detail.data?.category === 'conversion') {
      return 'conversion';
    }
    
    return 'event';
  };
  
  const eventType = getEventType();
  
  const getEventTypeLabel = () => {
    switch (eventType) {
      case 'lead': return 'Lead';
      case 'conversion': return 'Conversione';
      default: return 'Evento';
    }
  };
  
  const getEventIcon = () => {
    switch (eventType) {
      case 'lead': 
        return <User size={14} className="text-red-500 flex-shrink-0" />;
      case 'conversion': 
        return <DollarSign size={14} className="text-red-500 flex-shrink-0" />;
      default: 
        return <AlertCircle size={14} className="text-red-500 flex-shrink-0" />;
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
  
  // Ottieni i dettagli più importanti
  const getEventDetails = () => {
    if (eventType === 'lead') {
      // Nome per lead
      if (data.detail.data?.firstName) {
        return `${data.detail.data.firstName} ${data.detail.data.lastName || ''}`.trim();
      }
      // Email per lead
      if (data.detail.data?.email && !data.detail.data.email.includes('consent_not_granted')) {
        return data.detail.data.email.includes('fad327ee') ? 'Email criptata' : 'Email acquisita';
      }
      // Tipo di form
      if (data.detail.data?.formType) {
        return data.detail.data.formType;
      }
      return null;
    }
    
    if (eventType === 'conversion') {
      // Valore della conversione
      const value = data.detail.data?.value;
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && '$numberInt' in value) {
          return `€${(value as any).$numberInt}`;
        }
        return `€${value}`;
      }
      // Tipo di conversione
      if (data.detail.data?.conversionType) {
        return data.detail.data.conversionType;
      }
      return null;
    }
    
    // Altri eventi
    return data.detail.data?.category || null;
  };
  
  const eventDetails = getEventDetails();
  
  return (
    <div className="relative bg-red-500/20 border border-red-500 rounded-lg overflow-hidden min-w-[180px] max-w-[240px]">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-red-500 !border-red-500"
      />
      
      {/* Header */}
      <div className="flex items-center gap-2 p-2 bg-red-500/10">
        {getEventIcon()}
        <span className="text-xs font-medium text-white">{getEventTypeLabel()}</span>
        <span className="text-xs text-zinc-400 ml-auto">{getFormattedTime()}</span>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <div className="font-medium text-sm text-white mb-1 line-clamp-2 break-words" title={mainLabel}>
          {mainLabel}
        </div>
        
        {eventDetails && (
          <div className="text-xs text-zinc-400 truncate" title={eventDetails}>
            {eventDetails}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 !bg-red-500 !border-red-500"
      />
    </div>
  );
}