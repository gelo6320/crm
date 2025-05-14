// components/tracciamento/flow-nodes/EventNode.tsx - Updated
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
  
  // Determine if this is a lead acquisition or conversion event
  const isLead = 
    data.detail.type === 'lead_acquisition_contact' ||
    data.detail.type === 'form_interaction' && 
      (getMetadata('interactionType') === 'lead_facebook' || 
       getMetadata('interactionType') === 'email_collected' ||
       getMetadata('interactionType') === 'phone_collected') ||
    (getMetadata('name') && 
     getMetadata('name').includes('lead_acquisition')) ||
    getMetadata('isLeadForm') === true ||
    getMetadata('formType');
  
  // Extract value for conversions (handling MongoDB number format)
  const getValue = () => {
    const value = getMetadata('value');
    
    // If value is directly available
    if (value !== null) {
      if (typeof value === 'object' && value !== null) {
        // Handle MongoDB number format
        if ('$numberInt' in value) {
          return value.$numberInt;
        }
        return JSON.stringify(value);
      }
      return value;
    }
    
    return null;
  };
  
  // Format value with currency
  const getFormattedValue = () => {
    const value = getValue();
    if (value === null || value === undefined) return null;
    
    return `${value}€`;
  };
  
  // Extract name from various possible locations
  const getName = () => {
    // First check for explicit firstName/lastName
    const firstName = getMetadata('firstName');
    const lastName = getMetadata('lastName');
    
    if (firstName) {
      return `${firstName} ${lastName || ''}`;
    }
    
    // Check for name field
    const name = getMetadata('name');
    if (name && typeof name === 'string' && !name.includes('_')) {
      return name;
    }
    
    return '';
  };
  
  // Extract email with privacy consideration
  const getEmail = () => {
    const email = getMetadata('email');
    
    if (email && typeof email === 'string') {
      // Privacy check - don't show full email if consent not granted
      if (email.includes('consent_not_granted')) {
        return 'Email (protetta)';
      }
      return email;
    }
    
    return null;
  };
  
  // Extract phone
  const getPhone = () => {
    return getMetadata('phone');
  };
  
  // Get conversion type for display
  const getConversionType = () => {
    // Caso specifico per conversion_contact_form
    if (data.detail.type === 'conversion_contact_form') {
      return 'form_contatto';
    }
    
    const conversionType = getMetadata('conversionType');
    if (conversionType) return conversionType;
      
    const name = getMetadata('name');
    if (name && name.includes('conversion_')) 
      return name.replace('conversion_', '');
      
    return 'standard';
  };
  
  // Get form data for conversion_contact_form
  const getFormData = () => {
    if ((data.detail.type === 'conversion_contact_form' || 
         data.detail.type === 'form_interaction' && getMetadata('interactionType') === 'lead_facebook') && 
        data.detail.data?.formData) {
      return data.detail.data.formData;
    }
    return null;
  };
  
  // Get formatted time
  const getFormattedTime = () => {
    try {
      const date = new Date(data.detail.timestamp);
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  const name = getName();
  const email = getEmail();
  const phone = getPhone();
  const value = getFormattedValue();
  const conversionType = getConversionType();
  const formData = getFormData();
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-red-500 px-3 py-2 flex items-center">
        <AlertCircle size={16} className="text-white" />
        <span className="text-white font-medium ml-2">
          {isLead ? 'Lead' : 'Conversione'}
        </span>
        <span className="ml-auto text-xs text-white opacity-80">{getFormattedTime()}</span>
      </div>
      
      {/* Content */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        <div className="font-medium mb-2 text-zinc-900 dark:text-white">
          {isLead ? 'Nuovo Lead' : 'Conversione Completata'}
        </div>
        
        {/* Lead details */}
        {isLead && name && (
          <div className="flex items-center text-sm text-zinc-700 dark:text-zinc-300 mb-1">
            <User size={14} className="mr-1" />
            <span>{name}</span>
          </div>
        )}
        
        {isLead && email && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center">
            <Mail size={12} className="mr-1" />
            <span className="truncate">{email}</span>
          </div>
        )}
        
        {isLead && phone && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center">
            <Phone size={12} className="mr-1" />
            <span>{phone}</span>
          </div>
        )}
        
        {/* Form Data specifically for form submissions */}
        {formData && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
            {formData.email && formData.email !== email && (
              <div className="flex items-center mb-1">
                <Mail size={12} className="mr-1 text-red-700 dark:text-red-300" />
                <span>{formData.email}</span>
              </div>
            )}
            {formData.firstName && !name && (
              <div className="flex items-center">
                <User size={12} className="mr-1 text-red-700 dark:text-red-300" />
                <span>{formData.firstName} {formData.lastName || ''}</span>
              </div>
            )}
            {formData.phone && formData.phone !== phone && (
              <div className="flex items-center mt-1">
                <Phone size={12} className="mr-1 text-red-700 dark:text-red-300" />
                <span>{formData.phone}</span>
              </div>
            )}
            {formData.message && (
              <div className="flex items-center mt-1">
                <MessageSquare size={12} className="mr-1 text-red-700 dark:text-red-300" />
                <span className="truncate">{formData.message.substring(0, 20)}{formData.message.length > 20 ? '...' : ''}</span>
              </div>
            )}
            {/* Display consent information if available */}
            {formData.adOptimizationConsent !== undefined && (
              <div className="mt-1 text-red-700 dark:text-red-300">
                Consenso: {formData.adOptimizationConsent === true ? 'Sì' : 'No'}
              </div>
            )}
          </div>
        )}
        
        {/* Conversion details */}
        {!isLead && (
          <div className="mt-1">
            {value && (
              <div className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                {value}
              </div>
            )}
            
            <div className="text-xs py-1 px-2 rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 inline-block ml-2">
              {conversionType}
            </div>
          </div>
        )}
        
        {/* Display interaction type for form_interaction events */}
        {data.detail.type === 'form_interaction' && getMetadata('interactionType') && (
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Tipo: {getMetadata('interactionType')}
          </div>
        )}
      </div>
      
      {/* Connection points */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-red-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-red-500" />
    </div>
  );
}