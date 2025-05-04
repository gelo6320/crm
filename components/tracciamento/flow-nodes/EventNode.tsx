// components/tracciamento/flow-nodes/EventNode.tsx
import { Handle, Position } from 'reactflow';
import { AlertCircle, Mail, User, Phone, MessageSquare, Tag, DollarSign, FileText, Calendar } from 'lucide-react';

interface EventNodeProps {
  data: {
    label: string;
    detail: {
      type: string;
      data: any;
    }
  };
  isConnectable: boolean;
}

export default function EventNode({ data, isConnectable }: EventNodeProps) {
  // Ottieni l'etichetta specifica per il tipo di evento di conversione
  const getEventTypeLabel = () => {
    // Verifica il tipo di conversione
    
    // Conversione standard
    if (data.detail.data?.conversionType) {
      return `Conversione: ${data.detail.data.conversionType}`;
    }
    
    // Lead acquisition
    if ((data.detail.data?.name && data.detail.data.name.includes('lead_acquisition')) || 
        (data.detail.data?.formType)) {
      return 'Acquisizione Lead';
    }
    
    // Conversione generica
    if ((data.detail.data?.name && data.detail.data.name.includes('conversion')) || 
        data.detail.data?.category === 'conversion') {
      const eventName = data.detail.data.name || '';
      const conversionType = eventName.replace('conversion_', '');
      return `Conversione: ${conversionType || 'standard'}`;
    }
    
    return 'Evento di Conversione';
  };
  
  // Ottieni l'etichetta principale (seconda riga del label)
  const mainLabel = data.label.split('\n')[1] || data.label;
  
  // Determina il tipo specifico di evento per la visualizzazione corretta
  const isLeadAcquisition = 
    (data.detail.data?.name && data.detail.data.name.includes('lead_acquisition')) || 
    data.detail.data?.formType;
    
  const isConversion = 
    data.detail.data?.conversionType || 
    (data.detail.data?.name && data.detail.data.name.includes('conversion')) ||
    data.detail.data?.category === 'conversion';
  
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
      
      {/* Mostra la categoria se disponibile */}
      {data.detail.data?.category && (
        <div className="text-xs text-white mt-1 truncate flex items-center">
          <Tag size={12} className="mr-1" />
          <span>Categoria: {data.detail.data.category}</span>
        </div>
      )}
      
      {/* Visualizzazione per tutti i tipi di conversione */}
      {isConversion && !isLeadAcquisition && (
        <>
          {/* ConversionType */}
          {data.detail.data?.conversionType && (
            <div className="text-xs text-white mt-1 truncate flex items-center">
              <Tag size={12} className="mr-1" />
              <span>Tipo: {data.detail.data.conversionType}</span>
            </div>
          )}
          
          {/* Valore della conversione */}
          {data.detail.data?.value !== undefined && (
            <div className="text-xs text-white mt-1 truncate flex items-center">
              <DollarSign size={12} className="mr-1" />
              <span>Valore: {typeof data.detail.data.value === 'object' 
                ? (data.detail.data.value.$numberInt || data.detail.data.value) 
                : data.detail.data.value}</span>
            </div>
          )}
          
          {/* Timestamp della conversione se diverso dall'evento */}
          {data.detail.data?.timestamp && (
            <div className="text-xs text-white mt-1 truncate flex items-center">
              <Calendar size={12} className="mr-1" />
              <span>{new Date(data.detail.data.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
        </>
      )}
      
      {/* Visualizzazione specifica per lead acquisition */}
      {isLeadAcquisition && (
        <>
          {/* Tipo di form */}
          {data.detail.data?.formType && (
            <div className="text-xs text-white mt-1 truncate flex items-center">
              <FileText size={12} className="mr-1" />
              <span>Form: {data.detail.data.formType}</span>
            </div>
          )}
          
          {/* Dati utente - nome */}
          {data.detail.data?.firstName && (
            <div className="text-xs text-white mt-1 flex items-center">
              <User size={12} className="mr-1" />
              <span className="truncate">
                {data.detail.data.firstName} {data.detail.data.lastName || ''}
              </span>
            </div>
          )}
          
          {/* Dati utente - email */}
          {data.detail.data?.email && (
            <div className="text-xs text-white mt-1 flex items-center">
              <Mail size={12} className="mr-1" />
              <span className="truncate">
                {typeof data.detail.data.email === 'string' && 
                 data.detail.data.email.includes('fad327ee') 
                  ? 'Email criptata' 
                  : data.detail.data.email}
              </span>
            </div>
          )}
          
          {/* Dati utente - telefono */}
          {data.detail.data?.phone && (
            <div className="text-xs text-white mt-1 flex items-center">
              <Phone size={12} className="mr-1" />
              <span className="truncate">{data.detail.data.phone}</span>
            </div>
          )}
          
          {/* Messaggio dal formData */}
          {data.detail.data?.formData?.message && (
            <div className="text-xs text-white mt-1 flex items-center">
              <MessageSquare size={12} className="mr-1" />
              <span className="truncate">
                {data.detail.data.formData.message.length > 15 
                  ? 'Messaggio presente' 
                  : data.detail.data.formData.message}
              </span>
            </div>
          )}
          
          {/* Consenso marketing */}
          {data.detail.data?.adOptimizationConsent && (
            <div className="text-xs text-white mt-1 truncate">
              Consenso: {data.detail.data.adOptimizationConsent}
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