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
  // Determine if this is a lead acquisition or conversion event
  const isLead = 
    data.detail.type === 'lead_acquisition_contact' ||
    (data.detail.data?.name && 
     data.detail.data.name.includes('lead_acquisition')) ||
    data.detail.data?.formType;
  
  // Extract value for conversions
  const getValue = () => {
    // If value is directly available
    if (data.detail.data?.value !== undefined) {
      if (typeof data.detail.data.value === 'object' && data.detail.data.value !== null) {
        // Handle MongoDB number format
        if ('$numberInt' in data.detail.data.value) {
          return data.detail.data.value.$numberInt;
        }
        return JSON.stringify(data.detail.data.value);
      }
      return data.detail.data.value;
    }
    
    // Look in formData or metadata
    if (data.detail.data?.formData?.value) {
      return data.detail.data.formData.value;
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
    if (data.detail.data?.firstName) {
      return `${data.detail.data.firstName} ${data.detail.data.lastName || ''}`;
    }
    
    // Then check in formData
    if (data.detail.data?.formData?.firstName) {
      return `${data.detail.data.formData.firstName} ${data.detail.data.formData.lastName || ''}`;
    }
    
    // Check for name field
    if (data.detail.data?.name && typeof data.detail.data.name === 'string' && !data.detail.data.name.includes('_')) {
      return data.detail.data.name;
    }
    
    return '';
  };
  
  // Extract email from various possible locations
  const getEmail = () => {
    if (typeof data.detail.data?.email === 'string') {
      return data.detail.data.email;
    }
    
    if (data.detail.data?.formData?.email) {
      return data.detail.data.formData.email;
    }
    
    return null;
  };
  
  // Extract phone from various possible locations
  const getPhone = () => {
    if (data.detail.data?.phone) {
      return data.detail.data.phone;
    }
    
    if (data.detail.data?.formData?.phone) {
      return data.detail.data.formData.phone;
    }
    
    return null;
  };
  
  // Get conversion type for display
  const getConversionType = () => {
    if (data.detail.data?.conversionType) 
      return data.detail.data.conversionType;
      
    if (data.detail.type === 'conversion_contact_form')
      return 'contact_form';
      
    if (data.detail.data?.name && data.detail.data.name.includes('conversion_')) 
      return data.detail.data.name.replace('conversion_', '');
      
    return 'standard';
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
            <span className="truncate">
              {typeof email === 'string' && email.includes('consent_not_granted') 
                ? 'Email (protetta)' 
                : email}
            </span>
          </div>
        )}
        
        {isLead && phone && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center">
            <Phone size={12} className="mr-1" />
            <span>{phone}</span>
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
      </div>
      
      {/* Connection points */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-red-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-red-500" />
    </div>
  );
}