// components/tracciamento/flow-nodes/ActionNode.tsx
import { Handle, Position } from 'reactflow';
import { MousePointer, ArrowUp, FileText, Mail } from 'lucide-react';

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
  const getIconByType = () => {
    const type = data.detail.type;
    if (type === 'click' || type === 'event' && data.detail.data?.name === 'generic_click') 
      return <MousePointer size={16} className="text-white" />;
    if (type === 'form_submit') 
      return <FileText size={16} className="text-white" />;
    if (data.detail.data?.fieldName === 'email') 
      return <Mail size={16} className="text-white" />;
    return <MousePointer size={16} className="text-white" />;
  };
  
  const getActionTitle = () => {
    const type = data.detail.type;
    if (type === 'click') return 'Click';
    if (type === 'form_submit') return 'Form';
    if (type === 'event' && data.detail.data?.name === 'generic_click') return 'Click';
    if (data.detail.data?.fieldName === 'email') return 'Email';
    return 'Azione';
  };
  
  // Estrai solo la parte principale del label
  const mainText = data.label.split('\n')[1] || 'Interazione';
  
  // Verifica se abbiamo un evento di tipo click (in vari formati)
  const isGenericClick = data.detail.type === 'event' && 
    (data.detail.data?.name === 'generic_click' || data.detail.data?.tagName);
  
  // Verifica se è un evento di compilazione email
  const isEmailField = data.detail.type === 'event' && data.detail.data?.fieldName === 'email';
  
  return (
    <div className="rounded-lg shadow-sm overflow-hidden">
      {/* Header colorato */}
      <div className="bg-blue-500 px-3 py-2 flex items-center">
        {getIconByType()}
        <span className="text-white font-medium ml-2">{getActionTitle()}</span>
      </div>
      
      {/* Contenuto principale */}
      <div className="bg-white p-3 dark:bg-zinc-800">
        <div className="font-medium mb-1 text-zinc-900 dark:text-white truncate" title={mainText}>
          {mainText}
        </div>
        
        {/* Visualizzazione per click generici */}
        {isGenericClick && (
          <>
            {data.detail.data?.tagName && (
              <div className="text-xs mt-1 py-1 px-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 inline-block">
                {data.detail.data.tagName}
              </div>
            )}
            
            {data.detail.data?.text && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate" title={data.detail.data.text}>
                "{data.detail.data.text.substring(0, 30)}{data.detail.data.text.length > 30 ? '...' : ''}"
              </div>
            )}
            
            {data.detail.data?.id && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate" title={data.detail.data.id}>
                ID: {data.detail.data.id}
              </div>
            )}
          </>
        )}
        
        {/* Visualizzazione per campi email compilati */}
        {isEmailField && (
          <>
            <div className="text-xs py-1 px-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 inline-block">
              Campo Email
            </div>
            
            {data.detail.data?.form && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Form: {data.detail.data.form}
              </div>
            )}
          </>
        )}
        
        {/* Visualizzazione per form submit */}
        {data.detail.type === 'form_submit' && data.detail.data?.formId && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Form ID: {data.detail.data.formId}
          </div>
        )}
      </div>
      
      {/* Connettori */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 bg-blue-500" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 bg-blue-500" />
    </div>
  );
}