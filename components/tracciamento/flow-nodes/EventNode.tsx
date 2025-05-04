// components/tracciamento/flow-nodes/EventNode.tsx
import { Handle, Position } from 'reactflow';
import { AlertCircle, Mail, User, Phone, MessageSquare } from 'lucide-react';

interface EventNodeProps {
  data: {
    label: string;
    detail: {
      data: {
        name: string;
        value?: string | number;
        category?: string;
        type?: string;
        eventData?: Record<string, any>;
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
      // Verifichiamo se eventData.conversionType esiste prima di usarlo
      const conversionType = data.detail.data.eventData?.conversionType || data.detail.data.type || '';
      return `Conversione: ${conversionType || 'contatto'}`;
    }
    
    if (data.detail.data?.name?.includes('lead_acquisition')) {
      return 'Acquisizione Lead';
    }
    
    return 'Evento di Conversione';
  };
  
  // Ottieni l'etichetta principale (seconda riga del label)
  const mainLabel = data.label.split('\n')[1] || data.label;
  
  // Estrai eventData per gli eventi di conversione
  const eventData = data.detail.data?.eventData || {};
  
  // Determina il tipo di conversione
  const isLeadAcquisition = data.detail.data?.name?.includes('lead_acquisition');
  const isFormConversion = data.detail.data?.name?.includes('conversion');
  
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
      
      {/* Visualizzazione per conversione standard */}
      {isFormConversion && (
        <>
          {eventData.conversionType && (
            <div className="text-xs text-white mt-1 truncate">
              Tipo: {eventData.conversionType}
            </div>
          )}
          {eventData.value !== undefined && (
            <div className="text-xs text-white mt-1 truncate">
              Valore: {eventData.value}
            </div>
          )}
        </>
      )}
      
      {/* Visualizzazione specifica per lead acquisition */}
      {isLeadAcquisition && (
        <>
          {eventData.formType && (
            <div className="text-xs text-white mt-1 truncate">
              Form: {eventData.formType}
            </div>
          )}
          {eventData.firstName && (
            <div className="text-xs text-white mt-1 flex items-center">
              <User size={12} className="mr-1" />
              <span className="truncate">
                {eventData.firstName} {eventData.lastName || ''}
              </span>
            </div>
          )}
          {eventData.email && (
            <div className="text-xs text-white mt-1 flex items-center">
              <Mail size={12} className="mr-1" />
              <span className="truncate">{typeof eventData.email === 'string' && eventData.email.length > 20 ? 'Email presente' : eventData.email}</span>
            </div>
          )}
          {eventData.phone && (
            <div className="text-xs text-white mt-1 flex items-center">
              <Phone size={12} className="mr-1" />
              <span className="truncate">{eventData.phone}</span>
            </div>
          )}
          {eventData.formData?.message && (
            <div className="text-xs text-white mt-1 flex items-center">
              <MessageSquare size={12} className="mr-1" />
              <span className="truncate">{eventData.formData.message.length > 15 ? 'Messaggio presente' : eventData.formData.message}</span>
            </div>
          )}
        </>
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