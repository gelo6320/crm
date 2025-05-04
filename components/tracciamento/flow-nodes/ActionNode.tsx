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
  // Log per debug (rimuovere in produzione)
  // console.log("ActionNode - dati ricevuti:", data.detail);
  
  const getActionIcon = () => {
    switch (data.detail.type) {
      case 'click':
        return <MousePointer size={14} className="mr-2 text-info" />;
      case 'scroll':
        return <ArrowUp size={14} className="mr-2 text-info" />;
      case 'form_submit':
        return <FileText size={14} className="mr-2 text-info" />;
      default:
        // Per eventi generici con name = generic_click
        if (data.detail.type === 'event' && data.detail.data?.name === 'generic_click') {
          return <MousePointer size={14} className="mr-2 text-info" />;
        }
        // Per eventi con fieldName = email
        if (data.detail.type === 'event' && data.detail.data?.fieldName === 'email') {
          return <Mail size={14} className="mr-2 text-info" />;
        }
        // Per eventi con tagName (probabilmente click)
        if (data.detail.type === 'event' && data.detail.data?.tagName) {
          return <MousePointer size={14} className="mr-2 text-info" />;
        }
        return <MousePointer size={14} className="mr-2 text-info" />;
    }
  };

  const getActionTypeLabel = () => {
    // Gestisci l'evento generic_click
    if (data.detail.type === 'event' && data.detail.data?.name === 'generic_click') {
      return 'Click Generico';
    }
    
    // Gestisci eventi con dati di click
    if (data.detail.type === 'event' && data.detail.data?.tagName) {
      return `Click ${data.detail.data.tagName}`;
    }
    
    // Gestisci eventi con fieldName = email
    if (data.detail.type === 'event' && data.detail.data?.fieldName === 'email') {
      return 'Email Compilata';
    }
    
    if (data.detail.type === 'click') {
      if (data.detail.data?.formId) return 'Click Form';
      if (data.detail.data?.isNavigation) return 'Click Navigazione';
      return 'Click';
    }
    
    switch (data.detail.type) {
      case 'scroll':
        return 'Scroll';
      case 'form_submit':
        return 'Form Inviato';
      default:
        return data.detail.type;
    }
  };
  
  // Ottieni l'etichetta principale (seconda riga del label)
  const mainLabel = data.label.split('\n')[1] || data.label;

  // Verifica se abbiamo un evento di tipo click (in vari formati)
  const isGenericClick = data.detail.type === 'event' && 
    (data.detail.data?.name === 'generic_click' || data.detail.data?.tagName);
  
  // Verifica se è un evento di compilazione email
  const isEmailField = data.detail.type === 'event' && data.detail.data?.fieldName === 'email';
  
  return (
    <div className="p-3 rounded-md min-w-[200px] bg-info/20 border border-info text-white">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-info"
      />
      
      <div className="flex items-center mb-1">
        {getActionIcon()}
        <span className="text-xs font-medium text-white">{getActionTypeLabel()}</span>
      </div>
      
      <div className="font-medium text-sm truncate text-white" title={mainLabel}>
        {mainLabel}
      </div>
      
      {/* Visualizzazione per click generici */}
      {isGenericClick && (
        <>
          {data.detail.data?.tagName && (
            <div className="text-xs text-white mt-1">
              Tag: {data.detail.data.tagName}
            </div>
          )}
          {data.detail.data?.id && (
            <div className="text-xs text-white mt-1 truncate" title={data.detail.data.id}>
              ID: {data.detail.data.id}
            </div>
          )}
          {data.detail.data?.text && (
            <div className="text-xs text-white mt-1 truncate" title={data.detail.data.text}>
              Testo: {data.detail.data.text}
            </div>
          )}
          {data.detail.data?.class && (
            <div className="text-xs text-white mt-1 truncate" title={data.detail.data.class}>
              Classe: {data.detail.data.class.length > 20 
                ? data.detail.data.class.substring(0, 20) + '...' 
                : data.detail.data.class}
            </div>
          )}
          {/* Mostra posizione click se disponibile */}
          {data.detail.data?.position && (
            <div className="text-xs text-white mt-1">
              Posizione: {data.detail.data.position.x}, {data.detail.data.position.y}
            </div>
          )}
        </>
      )}
      
      {/* Visualizzazione per campi email compilati */}
      {isEmailField && (
        <>
          <div className="text-xs text-white mt-1">
            Campo: {data.detail.data.fieldName}
          </div>
          {data.detail.data?.form && (
            <div className="text-xs text-white mt-1">
              Form: {data.detail.data.form}
            </div>
          )}
          {data.detail.data?.url && (
            <div className="text-xs text-white mt-1 truncate" title={data.detail.data.url}>
              URL: {data.detail.data.url}
            </div>
          )}
        </>
      )}
      
      {/* Visualizzazione standard per click normali */}
      {data.detail.type === 'click' && data.detail.data?.selector && (
        <div className="text-xs text-white mt-1 truncate" title={data.detail.data.selector}>
          {data.detail.data.selector.length > 25 
            ? data.detail.data.selector.substring(0, 25) + '...' 
            : data.detail.data.selector}
        </div>
      )}
      
      {/* Visualizzazione per scroll */}
      {(data.detail.type === 'scroll' || 
        (data.detail.type === 'event' && (data.detail.data?.depth !== undefined || data.detail.data?.percent !== undefined))) && (
        <div className="text-xs text-white mt-1">
          Profondità: {data.detail.data?.depth || data.detail.data?.percent || 0}%
        </div>
      )}
      
      {/* Visualizzazione per form submit */}
      {data.detail.type === 'form_submit' && data.detail.data?.formId && (
        <div className="text-xs text-white mt-1">
          Form ID: {data.detail.data.formId}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-info"
      />
    </div>
  );
}