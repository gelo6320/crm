// components/tracciamento/flow-nodes/ActionNode.tsx
import { Handle, Position } from 'reactflow';
import { MousePointer, FileText, Mail, MousePointerClick } from 'lucide-react';

interface ActionNodeProps {
  data: {
    label: string;
    detail: {
      type: string;
      data: Record<string, any>;
    }
  };
  isConnectable: boolean;
}

export default function ActionNode({ data, isConnectable }: ActionNodeProps) {
  // Determine the appropriate icon based on event type
  const getIconByType = () => {
    const type = data.detail.type;
    const isClick = 
      type === 'click' || 
      type === 'generic_click' || 
      (type === 'event' && data.detail.data?.name === 'generic_click');
      
    if (isClick) return <MousePointerClick size={16} className="text-white" />;
    if (type === 'form_submit') return <FileText size={16} className="text-white" />;
    if (type === 'email_collected' || data.detail.data?.fieldName === 'email') 
      return <Mail size={16} className="text-white" />;
    
    return <MousePointer size={16} className="text-white" />;
  };
  
  // Get the appropriate title based on event type
  const getActionTitle = () => {
    const type = data.detail.type;
    if (type === 'click' || type === 'generic_click') return 'Click';
    if (type === 'event' && data.detail.data?.name === 'generic_click') return 'Click';
    if (type === 'form_submit') return 'Form';
    if (type === 'email_collected' || data.detail.data?.fieldName === 'email') return 'Email';
    
    // Check for specific event names
    if (type === 'event' && data.detail.data?.name) {
      if (data.detail.data.name === 'email_collected') return 'Email';
      return data.detail.data.name.charAt(0).toUpperCase() + data.detail.data.name.slice(1).replace(/_/g, ' ');
    }
    
    return 'Azione';
  };
  
  // Get click element text or email value
  const getElementDetails = () => {
    // For click events
    if (data.detail.data?.elementText) {
      return data.detail.data.elementText;
    }
    
    // For events with raw.text
    if (data.detail.data?.raw?.text) {
      return data.detail.data.raw.text;
    }
    
    // Check for standard text property
    if (data.detail.data?.text) {
      return data.detail.data.text;
    }
    
    return null;
  };
  
  // Get the HTML element type if available
  const getElementType = () => {
    if (data.detail.data?.elementType) {
      return data.detail.data.elementType;
    }
    
    if (data.detail.data?.tagName) {
      return data.detail.data.tagName;
    }
    
    if (data.detail.data?.raw?.tagName) {
      return data.detail.data.raw.tagName;
    }
    
    return null;
  };
  
  const elementText = getElementDetails();
  const elementType = getElementType();
  
  // Is this a click event?
  const isClick = data.detail.type === 'click' || 
                data.detail.type === 'generic_click' || 
                (data.detail.type === 'event' && data.detail.data?.name === 'generic_click');
  
  // Is this an email collection event?
  const isEmailEvent = data.detail.type === 'email_collected' || 
                     (data.detail.type === 'event' && data.detail.data?.name === 'email_collected') ||
                     data.detail.data?.fieldName === 'email';
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-blue-500 px-3 py-2 flex items-center">
        {getIconByType()}
        <span className="text-white font-medium ml-2">{getActionTitle()}</span>
      </div>
      
      {/* Content */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        {/* Main content area */}
        <div className="flex flex-col">
          {/* Element text (if available) */}
          {elementText && (
            <div className="font-medium mb-1 text-zinc-900 dark:text-white truncate" title={elementText}>
              "{elementText.substring(0, 20)}{elementText.length > 20 ? '...' : ''}"
            </div>
          )}
          
          {/* Element type tag (if available) */}
          {elementType && (
            <div className="text-xs mt-1 py-1 px-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 inline-block self-start">
              {elementType}
            </div>
          )}
          
          {/* For click events, show position if available */}
          {isClick && data.detail.data?.raw?.position && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Pos: {data.detail.data.raw.position.x},{data.detail.data.raw.position.y}
            </div>
          )}
          
          {/* For email events, show form details if available */}
          {isEmailEvent && data.detail.data?.raw?.form && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Form: {data.detail.data.raw.form}
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