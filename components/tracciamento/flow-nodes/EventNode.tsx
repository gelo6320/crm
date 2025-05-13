// components/tracciamento/flow-nodes/EventNode.tsx
import { Handle, Position } from 'reactflow';
import { AlertCircle, Mail, User, Phone, MessageSquare, Tag, DollarSign, Calendar } from 'lucide-react';

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
  // Determina se è un lead o conversione
  const isLead = data.detail.data?.formType || 
                (data.detail.data?.name && data.detail.data.name.includes('lead_acquisition'));
  
  // Estrai valore per conversioni
  const value = data.detail.data?.value;
  
  // Estrai nome per lead
  const name = data.detail.data?.firstName 
    ? `${data.detail.data.firstName} ${data.detail.data.lastName || ''}`
    : '';
    
  // Ottieni il tipo di conversione per visualizzazione
  const getConversionType = () => {
    if (data.detail.data?.conversionType) 
      return data.detail.data.conversionType;
      
    if (data.detail.data?.name && data.detail.data.name.includes('conversion_')) 
      return data.detail.data.name.replace('conversion_', '');
      
    return 'standard';
  };
  
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
      <div className="bg-red-500 px-3 py-2 flex items-center">
        <AlertCircle size={16} className="text-white" />
        <span className="text-white font-medium ml-2">
          {isLead ? 'Lead' : 'Conversione'}
        </span>
        <span className="ml-auto text-xs text-white opacity-80">{getFormattedTime()}</span>
      </div>
      
      {/* Contenuto principale */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        <div className="font-medium mb-2 text-zinc-900 dark:text-white">
          {isLead ? 'Nuovo Lead' : 'Conversione Completata'}
        </div>
        
        {/* Dettagli lead */}
        {isLead && name && (
          <div className="flex items-center text-sm text-zinc-700 dark:text-zinc-300 mb-1">
            <User size={14} className="mr-1" />
            <span>{name}</span>
          </div>
        )}
        
        {isLead && data.detail.data?.email && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center">
            <Mail size={12} className="mr-1" />
            <span className="truncate">
              {typeof data.detail.data.email === 'string' && data.detail.data.email.includes('consent_not_granted') 
                ? 'Email (protetta)' 
                : data.detail.data.email}
            </span>
          </div>
        )}
        
        {isLead && data.detail.data?.phone && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center">
            <Phone size={12} className="mr-1" />
            <span>{data.detail.data.phone}</span>
          </div>
        )}
        
        {/* Dettagli conversione */}
        {!isLead && (
          <div className="mt-1">
            {value !== undefined && (
              <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                {typeof value === 'object' && value !== null
                  ? ('$numberInt' in value ? value.$numberInt : JSON.stringify(value)) 
                  : value} €
              </div>
            )}
            
            {!value && (
              <div className="text-xs py-1 px-2 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 inline-block">
                {getConversionType()}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Connettori */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-red-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-red-500" />
    </div>
  );
}