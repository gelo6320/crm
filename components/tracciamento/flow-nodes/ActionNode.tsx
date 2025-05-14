// components/tracciamento/flow-nodes/ActionNode.tsx
import { Handle, Position } from 'reactflow';
import { MousePointer, FileText, Mail, MousePointerClick, Keyboard, FormInput } from 'lucide-react';

interface ActionNodeProps {
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

export default function ActionNode({ data, isConnectable }: ActionNodeProps) {
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
    
    // Check in raw if exists
    if (data.detail.data?.raw?.[key] !== undefined) {
      return data.detail.data.raw[key];
    }
    
    return defaultValue;
  };
  
  // Determine the appropriate icon based on event type
  const getIconByType = () => {
    const type = data.detail.type;
    const interactionType = getMetadata('interactionType');
    
    // Is this a click event?
    const isClick = 
      type === 'click' || 
      getMetadata('buttonType') ||
      (type === 'event' && getMetadata('name') === 'generic_click');
      
    if (isClick) return <MousePointerClick size={16} className="text-white" />;
    
    // Form interactions
    if (type === 'form_interaction') {
      if (interactionType === 'typing' || interactionType === 'filled') {
        return <Keyboard size={16} className="text-white" />;
      }
      if (interactionType === 'submit') {
        return <FileText size={16} className="text-white" />;
      }
      if (interactionType === 'focus') {
        return <FormInput size={16} className="text-white" />;
      }
      return <FileText size={16} className="text-white" />;
    }
    
    // Email related - but not a lead (those go in EventNode)
    if (type === 'email_interaction' || getMetadata('fieldName') === 'email') {
      return <Mail size={16} className="text-white" />;
    }
    
    return <MousePointer size={16} className="text-white" />;
  };
  
  // Get the appropriate title based on event type
  const getActionTitle = () => {
    const type = data.detail.type;
    const interactionType = getMetadata('interactionType');
    
    if (type === 'click') return 'Click';
    
    if (type === 'form_interaction') {
      if (interactionType === 'typing') return 'Input';
      if (interactionType === 'filled') return 'Campo';
      if (interactionType === 'focus') return 'Focus';
      if (interactionType === 'submit') return 'Submit';
      return interactionType ? `Form ${interactionType}` : 'Form';
    }
    
    if (type === 'event' && getMetadata('name')) {
      return getMetadata('name').charAt(0).toUpperCase() + 
             getMetadata('name').slice(1).replace(/_/g, ' ');
    }
    
    return 'Azione';
  };
  
  // Get click element text or input value
  const getElementDetails = () => {
    const type = data.detail.type;
    
    // For click events
    if (type === 'click') {
      return getMetadata('elementText') || getMetadata('text') || 
             getMetadata('buttonName') || '';
    }
    
    // For form interactions
    if (type === 'form_interaction') {
      const fieldName = getMetadata('fieldName') || '';
      const fieldValue = getMetadata('hasValue') ? '(con valore)' : '(vuoto)';
      return fieldName ? `${fieldName} ${fieldValue}` : '';
    }
    
    return '';
  };
  
  // Get the HTML element type if available
  const getElementType = () => {
    return getMetadata('elementType') || 
           getMetadata('tagName') || 
           getMetadata('fieldType') || 
           null;
  };
  
  const elementText = getElementDetails();
  const elementType = getElementType();
  
  // Is this a click event?
  const isClick = data.detail.type === 'click' || 
                getMetadata('buttonType') || 
                (data.detail.type === 'event' && getMetadata('name') === 'generic_click');
  
  // Is this a form interaction?
  const isFormInteraction = data.detail.type === 'form_interaction';
  
  // Get formatted time
  const getFormattedTime = () => {
    try {
      const date = data.detail.timestamp ? new Date(data.detail.timestamp) : new Date();
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden min-w-[220px] max-w-[320px] w-auto">
      {/* Header */}
      <div className="bg-blue-500 px-3 py-2 flex items-center">
        {getIconByType()}
        <span className="text-white font-medium ml-2">{getActionTitle()}</span>
        <span className="ml-auto text-xs text-white opacity-80 flex-shrink-0">{getFormattedTime()}</span>
      </div>
      
      {/* Content */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        {/* Main content area */}
        <div className="flex flex-col">
          {/* Element text or field name */}
          {elementText && (
            <div className="font-medium mb-1 text-zinc-900 dark:text-white break-words" title={elementText}>
              {isClick ? `"${elementText.substring(0, 20)}${elementText.length > 20 ? '...' : ''}"` : elementText}
            </div>
          )}
          
          {/* Element type tag (if available) */}
          {elementType && (
            <div className="text-xs mt-1 py-1 px-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 inline-block self-start">
              {elementType}
            </div>
          )}
          
          {/* Form name if available */}
          {isFormInteraction && getMetadata('formName') && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 break-words">
              Form: {getMetadata('formName')}
            </div>
          )}
          
          {/* For click events, show position if available */}
          {isClick && getMetadata('position') && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Pos: {getMetadata('position').x},{getMetadata('position').y}
            </div>
          )}
          
          {/* For click events, show href if available */}
          {isClick && getMetadata('href') && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 break-words" title={getMetadata('href')}>
              Link: {getMetadata('href').substring(0, 25)}{getMetadata('href').length > 25 ? '...' : ''}
            </div>
          )}
          
          {/* For form interactions, show more details */}
          {isFormInteraction && getMetadata('interactionType') === 'typing' && getMetadata('fieldLength') && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Lunghezza: {getMetadata('fieldLength')} caratteri
            </div>
          )}
        </div>
      </div>
      
      {/* Connection points */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-blue-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-blue-500" />
    </div>
  );
}