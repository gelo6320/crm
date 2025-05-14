// components/tracciamento/flow-nodes/FormNode.tsx
import { Handle, Position } from 'reactflow';
import { FileText, FormInput, Keyboard, Send, Mail, Phone, User } from 'lucide-react';

interface FormNodeProps {
  data: {
    label: string;
    detail: {
      type: string;
      data: Record<string, any>;
      timestamp?: string;
    }
  };
  isConnectable: boolean;
}

export default function FormNode({ data, isConnectable }: FormNodeProps) {
  // Helper per estrarre dati da diverse locazioni nell'oggetto
  const getMetadata = (key: string, defaultValue: any = null) => {
    // Check in data directly
    if (data.detail.data?.[key] !== undefined) {
      return data.detail.data[key];
    }
    
    // Check in metadata if exists
    if (data.detail.data?.metadata?.[key] !== undefined) {
      return data.detail.data.metadata[key];
    }
    
    // Check in formData if exists
    if (data.detail.data?.formData?.[key] !== undefined) {
      return data.detail.data.formData[key];
    }
    
    // Check in raw if exists
    if (data.detail.data?.raw?.[key] !== undefined) {
      return data.detail.data.raw[key];
    }
    
    return defaultValue;
  };
  
  // Determina il tipo di interazione con il form
  const interactionType = getMetadata('interactionType', 'generic');
  
  // Determina l'icona appropriata in base al tipo di interazione
  const getFormIcon = () => {
    switch(interactionType) {
      case 'typing': return <Keyboard size={16} className="text-white" />;
      case 'focus': return <FormInput size={16} className="text-white" />;
      case 'blur': return <FormInput size={16} className="text-white" />;
      case 'submit': return <Send size={16} className="text-white" />;
      case 'filled': return <FileText size={16} className="text-white" />;
      case 'email_collected': return <Mail size={16} className="text-white" />;
      case 'phone_collected': return <Phone size={16} className="text-white" />;
      default: return <FormInput size={16} className="text-white" />;
    }
  };
  
  // Ottieni il nome del campo o del form
  const getFormLabel = () => {
    const formName = getMetadata('formName', '');
    const fieldName = getMetadata('fieldName', '');
    
    if (interactionType === 'phone_collected') {
      return `Telefono Raccolto`;
    } else if (interactionType === 'email_collected') {
      return `Email Raccolto`;
    } else if (interactionType === 'submit' && formName) {
      return `Form ${formName}`;
    } else if (fieldName) {
      return `Campo ${fieldName}`;
    } else if (formName) {
      return `Form ${formName}`;
    } else {
      return `Form ${interactionType}`;
    }
  };
  
  // Ottieni dettagli sul valore raccolto
  const getValueInfo = () => {
    if (interactionType === 'phone_collected') {
      return getMetadata('phone') || '';
    } else if (interactionType === 'email_collected') {
      return getMetadata('email') || '';
    }
    
    if (getMetadata('hasValue') !== undefined) {
      return getMetadata('hasValue') ? 'Con valore' : 'Vuoto';
    }
    
    return '';
  };
  
  // Ottieni orario formattato
  const getFormattedTime = () => {
    try {
      const date = data.detail.timestamp ? new Date(data.detail.timestamp) : new Date();
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  const valueInfo = getValueInfo();
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden min-w-[220px] max-w-[320px] w-auto">
      {/* Header */}
      <div className="bg-purple-500 px-3 py-2 flex items-center">
        {getFormIcon()}
        <span className="text-white font-medium ml-2">Form</span>
        <span className="ml-auto text-xs text-white opacity-80 flex-shrink-0">{getFormattedTime()}</span>
      </div>
      
      {/* Content */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        <div className="font-medium mb-1 text-zinc-900 dark:text-white break-words">{getFormLabel()}</div>
        
        {/* Interaction type badge */}
        <div className="text-xs py-1 px-2 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 inline-block">
          {interactionType}
        </div>
        
        {/* Form details */}
        {getMetadata('formName') && interactionType !== 'submit' && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 break-words">
            Form: {getMetadata('formName')}
          </div>
        )}
        
        {getMetadata('fieldName') && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 break-words">
            Campo: {getMetadata('fieldName')}
          </div>
        )}
        
        {/* Value details */}
        {valueInfo && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium break-words">
            {valueInfo}
          </div>
        )}
        
        {/* Handle complete form data if available */}
        {getMetadata('formData') && interactionType !== 'lead_facebook' && (
          <div className="mt-2 bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-xs">
            <div className="font-medium mb-1 text-purple-700 dark:text-purple-300">Dati Form:</div>
            {getMetadata('formData').email && (
              <div className="flex items-center mt-1">
                <Mail size={12} className="mr-1 text-purple-600 dark:text-purple-400 flex-shrink-0" /> 
                <span className="break-words">{getMetadata('formData').email}</span>
              </div>
            )}
            {getMetadata('formData').phone && (
              <div className="flex items-center mt-1">
                <Phone size={12} className="mr-1 text-purple-600 dark:text-purple-400 flex-shrink-0" /> 
                <span className="break-words">{getMetadata('formData').phone}</span>
              </div>
            )}
            {(getMetadata('formData').firstName || getMetadata('formData').lastName) && (
              <div className="flex items-center mt-1">
                <User size={12} className="mr-1 text-purple-600 dark:text-purple-400 flex-shrink-0" /> 
                <span className="break-words">
                  {getMetadata('formData').firstName || ''} {getMetadata('formData').lastName || ''}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Connection points - posizioni che cambieranno dinamicamente in base al layout */}
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable} 
        className="w-2 h-2 bg-purple-500" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        isConnectable={isConnectable} 
        className="w-2 h-2 bg-purple-500" 
      />
    </div>
  );
}