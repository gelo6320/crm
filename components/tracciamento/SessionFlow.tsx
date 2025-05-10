// Modifica da fare nel file SessionFlow.tsx
// Versione ottimizzata per mobile con miglioramenti di layout e interazione

import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Panel,
  MiniMap,
  addEdge,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  NodeMouseHandler
} from 'reactflow';
import 'reactflow/dist/style.css';
import { SessionDetail, UserSession } from '@/types/tracciamento';
import { formatDateTime } from '@/lib/utils/date';
import { formatTime } from '@/lib/utils/format';
import { ArrowLeft, ZoomIn, ZoomOut, MousePointer, Info, AlertCircle, Eye, ArrowRight, X, MapPin } from 'lucide-react';

// Importa i tipi di nodi personalizzati
import PageNode from './flow-nodes/PageNode';
import ActionNode from './flow-nodes/ActionNode';
import EventNode from './flow-nodes/EventNode';
import NavigationNode from './flow-nodes/NavigationNode';

interface SessionFlowProps {
  sessionDetails: SessionDetail[];
  session: UserSession;
  onBack: () => void;
  isLoading: boolean;
}

// Registra i tipi di nodi personalizzati
const nodeTypes = {
  pageNode: PageNode,
  actionNode: ActionNode,
  eventNode: EventNode,
  navigationNode: NavigationNode,
};

export default function SessionFlow({
  sessionDetails,
  session,
  onBack,
  isLoading
}: SessionFlowProps) {
  console.log("SessionFlow: Rendering con", sessionDetails?.length || 0, "dettagli");
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [noData, setNoData] = useState(false);
  const [isLegendVisible, setIsLegendVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const flowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);
  
  // Rileva se siamo su dispositivo mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Preprocessa i dati della sessione per creare nodi e bordi
  useEffect(() => {
    if (isLoading) {
      setNoData(false);
      return;
    }
    
    console.log("SessionFlow: Elaborazione dettagli sessione", { 
      count: sessionDetails?.length || 0, 
      details: sessionDetails 
    });
    
    // Verifica se ci sono dati sufficienti
    if (!sessionDetails || sessionDetails.length < 2) {
      console.warn("Dati insufficienti per visualizzare il flow:", sessionDetails?.length || 0);
      setNoData(true);
      return;
    } else {
      setNoData(false);
    }
    
    // Crea i nodi
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Log per debug
    console.log("Elaborazione di", sessionDetails.length, "dettagli sessione");
    sessionDetails.forEach((detail, index) => {
      console.log(`Dettaglio ${index}:`, detail);
    });
    
    sessionDetails.forEach((detail, index) => {
      let nodeType = 'actionNode';
      let nodeBackground = '#3498db'; // Default blu
      let nodeBorder = '1px solid #1e6091';
      let nodeTextColor = 'white';
    
      // Debug: log completo di ogni dettaglio
      console.log(`Processamento nodo ${index}:`, {
        type: detail.type,
        eventName: detail.data?.name || detail.data?.eventName,
        category: detail.data?.category
      });
    
      // Determina il tipo di nodo in base al tipo di evento
      if (detail.type === 'page_view') {
        nodeType = 'pageNode';
        nodeBackground = '#FF6B00'; // Primario
        nodeBorder = '1px solid #d05600';
      } 
      // Eventi di conversione - verifica tutte le possibili strutture
      else if (
        // Conversioni standard
        (detail.type === 'event' && detail.data?.category === 'conversion') || 
        // Conversioni specifiche
        (detail.type === 'event' && detail.data?.conversionType) ||
        // Nome dell'evento contiene "conversion"
        (detail.type === 'event' && detail.data?.name && 
          (detail.data.name.includes('conversion') || detail.data.name.includes('lead_acquisition'))) ||
        // Nome dell'evento in eventName contiene "conversion"
        (detail.type === 'event' && detail.data?.eventName && 
          (detail.data.eventName.includes('conversion') || detail.data.eventName.includes('lead_acquisition')))
      ) {
        nodeType = 'eventNode';
        nodeBackground = '#e74c3c'; // Rosso per eventi di conversione
        nodeBorder = '1px solid #c0392b';
      }
      // Eventi di click - verifica tutte le possibili strutture 
      else if (
        // Click diretti come tipo
        detail.type === 'click' ||
        // Generic click come evento
        (detail.type === 'event' && detail.data?.name === 'generic_click') ||
        // Eventi con tagName (probable click)
        (detail.type === 'event' && detail.data?.tagName) ||
        // Eventi con campo email compilato
        (detail.type === 'event' && detail.data?.fieldName === 'email')
      ) {
        nodeType = 'actionNode';
        nodeBackground = '#3498db'; // Blu per click
        nodeBorder = '1px solid #1e6091';
      }
      // Eventi media
      else if (
        (detail.type === 'event' && detail.data?.category === 'media') ||
        (detail.type === 'event' && detail.data?.name && 
          (detail.data.name.includes('video') || detail.data.name.includes('audio')))
      ) {
        nodeType = 'actionNode';
        nodeBackground = '#9b59b6'; // Viola per media
        nodeBorder = '1px solid #8e44ad';
      }
      // Eventi di form
      else if (
        detail.type === 'form_submit' ||
        (detail.type === 'event' && detail.data?.category === 'form') ||
        (detail.type === 'event' && detail.data?.name && detail.data.name.includes('form'))
      ) {
        nodeType = 'actionNode';
        nodeBackground = '#f39c12'; // Arancione per form
        nodeBorder = '1px solid #d35400';
      }
      // Gli eventi di navigazione
      else if (
        detail.type === 'scroll' || 
        detail.type === 'time_on_page' || 
        detail.type === 'exit_intent' ||
        (detail.type === 'event' && detail.data?.category === 'navigation') ||
        (detail.type === 'event' && detail.data?.name && 
          (detail.data.name.includes('exit_intent') || 
           detail.data.name.includes('scroll') || 
           detail.data.name.includes('navigation') ||
           detail.data.name.includes('page_visibility') ||
           detail.data.name.includes('session_end'))) ||
        // Verifica di proprietà specifiche di navigazione
        (detail.type === 'event' && 
          (detail.data?.depth !== undefined || 
           detail.data?.totalScrollDistance !== undefined || 
           detail.data?.timeOnPage !== undefined || 
           detail.data?.seconds !== undefined ||
           detail.data?.visible !== undefined))
      ) {
        nodeType = 'navigationNode';
        nodeBackground = '#2ecc71'; // Verde per eventi di navigazione
        nodeBorder = '1px solid #27ae60';
      }
      
      // Adatta la posizione dei nodi per mobile
      const xPosition = isMobile 
        ? 20 + (index % 2) * (window.innerWidth - 180) / 2  // Spazio più ridotto per mobile
        : 250 * (index % 2);
      
      const yPosition = isMobile
        ? 100 * index  // Meno spazio verticale su mobile
        : 120 * index;
      
      // Crea il nodo
      const node: Node = {
        id: detail.id,
        type: nodeType,
        data: { 
          detail,
          label: getNodeLabel(detail)
        },
        position: { x: xPosition, y: yPosition },
        style: {
          border: nodeBorder,
          borderRadius: '5px',
          backgroundColor: nodeBackground,
          color: nodeTextColor,
          fontWeight: 500,
          padding: isMobile ? '6px' : '8px',  // Padding ridotto su mobile
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: isMobile ? '12px' : '14px',  // Font più piccolo su mobile
          width: isMobile ? '140px' : '180px',  // Larghezza ridotta su mobile
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
      
      newNodes.push(node);
      
      // Crea i bordi tra i nodi
      if (index > 0) {
        const timeBetween = getTimeDifference(
          new Date(sessionDetails[index - 1].timestamp),
          new Date(detail.timestamp)
        );
        
        // Assicurati che l'etichetta mostri correttamente secondi vs minuti
        const edge: Edge = {
          id: `edge-${sessionDetails[index - 1].id}-${detail.id}`,
          source: sessionDetails[index - 1].id,
          target: detail.id,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: '#64748b', // Slate-500
          },
          style: {
            stroke: '#64748b', // Slate-500
          },
          data: {
            timeDiff: timeBetween
          },
          label: timeBetween,
          labelStyle: { 
            fill: '#94a3b8', 
            fontWeight: 500,
            fontSize: isMobile ? '10px' : '12px', // Font più piccolo per label su mobile
          },
          labelBgStyle: { fill: '#1e293b', fillOpacity: 0.7 },
        };
        
        newEdges.push(edge);
      }
    });
    
    console.log("Flow generato:", { nodes: newNodes.length, edges: newEdges.length });
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Usa un timeout per dare tempo a ReactFlow di renderizzare i nodi prima di centrarli
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: isMobile ? 0.1 : 0.2 });
      }
    }, 100);
  }, [sessionDetails, isLoading, setNodes, setEdges, isMobile]);
  
  const getNodeLabel = (detail: SessionDetail) => {
    const defaultLabel = "Evento non specificato";
    
    if (!detail || !detail.type) {
      console.warn("Dettaglio mancante o tipo non specificato", detail);
      return defaultLabel;
    }
    
    try {
      // Log completo dei dati per debug
      console.log(`getNodeLabel - elaborazione dettaglio:`, {
        type: detail.type,
        data: detail.data
      });
      
      switch (detail.type) {
        // ===== VISUALIZZAZIONE PAGINA =====
        case 'page_view':
          if (detail.data?.url) {
            const pageTitle = detail.data.title || new URL(detail.data.url).pathname;
            const truncatedTitle = isMobile && pageTitle.length > 30 
              ? pageTitle.substring(0, 27) + '...'
              : pageTitle;
            return `Pagina\n${truncatedTitle}`;
          }
          return `Pagina\n${detail.data?.title || 'sconosciuta'}`;
        
        // ===== CLICK DIRETTI =====
        case 'click':
          // Verifica la struttura dei dati del click
          if (detail.data?.tagName) {
            const text = detail.data.text || 'elemento';
            const truncatedText = isMobile && text.length > 20 
              ? text.substring(0, 17) + '...'
              : text;
            return `Click ${detail.data.tagName}\n${truncatedText}`;
          } else if (detail.data?.formId) {
            return `Click Campo\n${detail.data.element || 'campo'}`;
          } else if (detail.data?.selector && detail.data.selector.includes('form')) {
            return `Click Form\n${detail.data.element || 'elemento'}`;
          } else if (detail.data?.isNavigation) {
            return `Click Nav\n${detail.data.element || 'link'}`;
          } else if (detail.data?.text) {
            const text = detail.data.text;
            const truncatedText = isMobile && text.length > 20 
              ? text.substring(0, 17) + '...'
              : text;
            return `Click\n${truncatedText}`;
          }
          return `Click\n${detail.data?.element || 'elemento'}`;
        
        // ===== SCROLL DIRETTI =====
        case 'scroll':
          const direction = detail.data?.direction === 'up' ? '↑' : '↓';
          return `Scroll ${direction}\n${detail.data?.depth || detail.data?.percent || '?'}%`;
        
        // ===== TEMPO SULLA PAGINA DIRETTI =====
        case 'time_on_page':
          return `Tempo Pagina\n${formatTime(detail.data?.duration || detail.data?.seconds || 0)}`;
          
        // ===== EXIT INTENT DIRETTI =====
        case 'exit_intent':
          return `Exit Intent\nIn uscita`;
        
        // ===== FORM SUBMIT DIRETTI =====
        case 'form_submit':
          if (detail.data?.formId) {
            return `Form\n${detail.data.formId}`;
          }
          return `Form\n${detail.data?.page || 'pagina'}`;
        
        // ===== EVENTI GENERICI =====
        case 'event':
          // ----- CLICK GENERICI -----
          if (detail.data?.name === 'generic_click' || (detail.data?.tagName && detail.data?.text)) {
            const tagName = detail.data?.tagName || 'elemento';
            const text = detail.data?.text || '';
            const truncatedText = isMobile && text.length > 20 
              ? text.substring(0, 17) + '...'
              : text;
            return `Click ${tagName}\n${truncatedText}`;
          }
          
          // ----- EMAIL COMPILATA -----
          if (detail.data?.fieldName === 'email') {
            return `Email\n${detail.data.form || 'Form'}`;
          }
          
          // ----- CONVERSIONI -----
          if (detail.data?.conversionType || 
              (detail.data?.name && detail.data.name.includes('conversion')) ||
              (detail.data?.eventName && detail.data.eventName.includes('conversion')) ||
              detail.data?.category === 'conversion') {
            
            const conversionType = detail.data?.conversionType || 
                                 (detail.data?.name?.replace('conversion_', '') || 
                                 'standard');
            
            const value = typeof detail.data?.value === 'object' && detail.data?.value !== null 
                                  ? ('$numberInt' in detail.data.value 
                                     ? (detail.data.value as any).$numberInt 
                                     : detail.data.value)
                                  : detail.data?.value;
            
            const truncatedType = isMobile && conversionType.length > 15 
              ? conversionType.substring(0, 12) + '...'
              : conversionType;
            
            return `Conversione\n${truncatedType}${value ? ` (${value})` : ''}`;
          }
          
          // ----- LEAD ACQUISITION -----
          if ((detail.data?.name && detail.data.name.includes('lead_acquisition')) ||
              (detail.data?.eventName && detail.data.eventName.includes('lead_acquisition')) ||
              detail.data?.formType) {
            
            let leadInfo = '';
            if (detail.data?.firstName) {
              leadInfo = `${detail.data.firstName} ${detail.data.lastName || ''}`;
            } else if (detail.data?.email) {
              leadInfo = detail.data.email.includes('consent_not_granted') 
                      ? 'Anonimo' 
                      : 'Email';
            } else {
              leadInfo = 'Lead';
            }
            
            const truncatedInfo = isMobile && leadInfo.length > 20 
              ? leadInfo.substring(0, 17) + '...'
              : leadInfo;
            
            return `Lead\n${truncatedInfo}`;
          }
          
          // ----- EVENTI DI NAVIGAZIONE -----
          // Scroll
          if (detail.data?.name === 'scroll' || 
              detail.data?.name === 'scroll_depth' || 
              detail.data?.name === 'scroll_bottom' ||
              detail.data?.depth !== undefined ||
              detail.data?.totalScrollDistance !== undefined ||
              detail.data?.percent !== undefined) {
            
            const depth = detail.data?.depth || 
                        detail.data?.percent || 
                        (detail.data?.data?.depth) || 
                        (detail.data?.data?.percent) || 
                        '?';
            
            if (detail.data?.name === 'scroll_bottom') {
              return `Scroll Fine\n100%`;
            }
            
            return `Scroll\n${depth}%`;
          }
          
          // Tempo sulla pagina
          if (detail.data?.name === 'time_on_page' || 
              detail.data?.timeOnPage !== undefined || 
              detail.data?.seconds !== undefined) {
            
            const seconds = detail.data?.timeOnPage || 
                          detail.data?.seconds || 
                          detail.data?.data?.timeOnPage || 
                          detail.data?.data?.seconds || 
                          0;
            
            return `Tempo\n${seconds}s`;
          }
          
          // Visibilità pagina
          if (detail.data?.name === 'page_visibility' || detail.data?.visible !== undefined) {
            const isVisible = detail.data?.visible || 
                            (detail.data?.data?.visible);
            
            return `Visibilità\n${isVisible ? 'Visibile' : 'Nascosta'}`;
          }
          
          // Fine sessione
          if (detail.data?.name === 'session_end' || detail.data?.totalTimeOnPage) {
            const totalTime = detail.data?.totalTimeOnPage || 
                            detail.data?.data?.totalTimeOnPage || 
                            0;
            
            const pageViews = detail.data?.pageViews || 
                            detail.data?.data?.pageViews || 
                            1;
            
            return `Fine Sessione\n${pageViews}p ${totalTime}s`;
          }
          
          // Exit intent
          if (detail.data?.name && detail.data.name.includes('exit_intent')) {
            return `Exit Intent\nIn uscita`;
          }
          
          // ----- EVENTI MEDIA -----
          if (detail.data?.category === 'media' || 
              (detail.data?.name && 
                (detail.data.name.includes('video') || 
                 detail.data.name.includes('audio')))) {
            
            let mediaType = 'Media';
            let action = 'Play';
            
            if (detail.data?.name) {
              if (detail.data.name.includes('video')) mediaType = 'Video';
              if (detail.data.name.includes('audio')) mediaType = 'Audio';
              if (detail.data.name.includes('start')) action = 'Start';
              if (detail.data.name.includes('progress')) action = 'Progress';
              if (detail.data.name.includes('complete')) action = 'Complete';
              if (detail.data.name.includes('pause')) action = 'Pause';
            }
            
            const progress = detail.data?.progress || 
                           detail.data?.data?.progress || 
                           '?';
            
            return `${mediaType}\n${action} ${progress}%`;
          }
          
          // ----- EVENTI FUNNEL -----
          if (detail.data?.name === 'funnel_progression' || 
              detail.data?.funnelName || 
              (detail.data?.fromStep !== undefined && detail.data?.toStep !== undefined)) {
            
            const funnelName = detail.data?.funnelName || 'principale';
            const toStep = detail.data?.toStep || 
                         detail.data?.data?.toStep || 
                         '?';
            
            const truncatedName = isMobile && funnelName.length > 15 
              ? funnelName.substring(0, 12) + '...'
              : funnelName;
            
            return `Funnel\n${truncatedName} → ${toStep}`;
          }
          
          // ----- ALTRI EVENTI CON NOME -----
          if (detail.data?.name) {
            const name = detail.data.name;
            const truncatedName = isMobile && name.length > 20 
              ? name.substring(0, 17) + '...'
              : name;
            
            if (detail.data?.category) {
              return `${truncatedName}\n${detail.data.category}`;
            }
            return `Evento\n${truncatedName}`;
          } else if (detail.data?.eventName) {
            const eventName = detail.data.eventName;
            const truncatedName = isMobile && eventName.length > 20 
              ? eventName.substring(0, 17) + '...'
              : eventName;
            
            if (detail.data?.category) {
              return `${truncatedName}\n${detail.data.category}`;
            }
            return `Evento\n${truncatedName}`;
          }
          
          // Fallback
          return `Evento\n${detail.data?.type || 'generico'}`;
        
        // ===== FALLBACK PER ALTRI TIPI =====
        default:
          if (detail.data?.name) {
            const name = detail.data.name;
            const truncatedName = isMobile && name.length > 20 
              ? name.substring(0, 17) + '...'
              : name;
            return `${detail.type}\n${truncatedName}`;
          } else if (detail.data?.eventName) {
            const eventName = detail.data.eventName;
            const truncatedName = isMobile && eventName.length > 20 
              ? eventName.substring(0, 17) + '...'
              : eventName;
            return `${detail.type}\n${truncatedName}`;
          }
          return detail.type;
      }
    } catch (error) {
      console.error("Errore durante la generazione dell'etichetta del nodo:", error);
      console.error("Dettaglio problematico:", detail);
      return defaultLabel;
    }
  };
  
  // Formatta la differenza di tempo tra due date
  const getTimeDifference = (date1: Date, date2: Date) => {
    try {
      const diffMs = Math.abs(date2.getTime() - date1.getTime());
      const diffSecs = Math.floor(diffMs / 1000);
      
      if (diffSecs < 60) {
        return `${diffSecs}s`;  // Formato secondi
      }
      
      const diffMins = Math.floor(diffSecs / 60);
      const remainingSecs = diffSecs % 60;
      
      if (diffMins < 60) {
        return `${diffMins}m ${remainingSecs}s`;  // Formato minuti e secondi
      }
      
      // Aggiungiamo il caso per ore se necessario
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      
      return `${diffHours}h ${remainingMins}m`;  // Formato ore e minuti
    } catch (error) {
      console.error("Errore nel calcolo della differenza di tempo:", error);
      return "?";
    }
  };
  
  // Gestisci la connessione di bordi (se l'utente ne crea manualmente)
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
  // Gestisci il click sui nodi
  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode(node);
    if (isMobile) {
      // Su mobile, centra il nodo selezionato
      reactFlowInstance.current?.zoomTo(1);
      reactFlowInstance.current?.fitBounds(
        { x: node.position.x - 50, y: node.position.y - 50, width: 200, height: 100 },
        { duration: 300 }
      );
    }
  }, [isMobile]);
  
  // Gestisci lo zoom
  const handleZoomIn = () => {
    if (reactFlowInstance.current) {
      const zoom = Math.min(zoomLevel + 0.2, 2);
      reactFlowInstance.current.zoomTo(zoom);
      setZoomLevel(zoom);
    }
  };
  
  const handleZoomOut = () => {
    if (reactFlowInstance.current) {
      const zoom = Math.max(zoomLevel - 0.2, 0.5);
      reactFlowInstance.current.zoomTo(zoom);
      setZoomLevel(zoom);
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento dettagli della sessione in corso...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-zinc-700 bg-zinc-900/50">
        <h2 className="text-sm sm:text-base font-medium">
          {isMobile ? 'Percorso' : 'Percorso di Navigazione'}
        </h2>
        <button
          onClick={onBack}
          className="btn btn-outline flex items-center space-x-1 py-1 px-2 text-xs sm:text-sm"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Indietro</span>
          <span className="sm:hidden">Indietro</span>
        </button>
      </div>
      
      {/* Riepilogo sessione ottimizzato per mobile */}
      <div className="p-2 sm:p-4 border-b border-zinc-700 bg-zinc-800/30">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
          <div>
            <h3 className="font-medium text-sm sm:text-base">
              {isMobile 
                ? `${new Date(session.startTime).toLocaleDateString('it-IT')}` 
                : `Sessione del ${new Date(session.startTime).toLocaleDateString('it-IT')}`
              }
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {new Date(session.startTime).toLocaleTimeString('it-IT')}
              {session.endTime && !isMobile && ` - ${new Date(session.endTime).toLocaleTimeString('it-IT')}`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            <div className="text-center p-1 sm:p-2 bg-zinc-900 rounded">
              <div className="text-xs text-zinc-400">Durata</div>
              <div className="text-sm sm:text-lg font-medium text-primary">
                {formatTime(session.duration)} min
              </div>
            </div>
            <div className="text-center p-1 sm:p-2 bg-zinc-900 rounded">
              <div className="text-xs text-zinc-400">Int.</div>
              <div className="text-sm sm:text-lg font-medium text-info">
                {session.interactionsCount}
              </div>
            </div>
            <div className="text-center p-1 sm:p-2 bg-zinc-900 rounded">
              <div className="text-xs text-zinc-400">Pagine</div>
              <div className="text-sm sm:text-lg font-medium text-success">
                {session.pagesViewed}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {sessionDetails.length === 0 || noData ? (
        <div className="p-4 sm:p-8 text-center text-zinc-500">
          <p className="mb-2 text-sm sm:text-base">
            Nessun dettaglio disponibile per questa sessione.
          </p>
          <p className="text-xs sm:text-sm">
            Non sono state registrate interazioni o visualizzazioni di pagina sufficienti.
          </p>
          <button
            onClick={onBack}
            className="mt-4 btn btn-outline flex items-center mx-auto space-x-1 py-1 px-3 text-xs sm:text-sm"
          >
            <ArrowLeft size={14} />
            <span>Torna alle sessioni</span>
          </button>
        </div>
      ) : (
          <div className="flow-wrapper relative" ref={flowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              onInit={(instance) => {
                reactFlowInstance.current = instance;
                console.log("ReactFlow inizializzato");
                // Importante: usa setTimeout per dare tempo al componente di renderizzare
                setTimeout(() => {
                  console.log("Esecuzione fitView");
                  if (instance && typeof instance.fitView === 'function') {
                    instance.fitView({ padding: isMobile ? 0.1 : 0.2 });
                  }
                }, 300);
              }}
              style={{ width: '100%', height: '100%' }}
              proOptions={{ hideAttribution: true }}
              nodeOrigin={[0.5, 0.5]}
              panOnScroll={true}
              panOnDrag={true}
              minZoom={0.3}
              maxZoom={2}
            >
              <Background color="#64748b" gap={16} size={1} />
              
              {/* Controls ottimizzati per mobile */}
              <Controls 
                showInteractive={false}
                style={{
                  left: isMobile ? '10px' : 'auto',
                  right: isMobile ? 'auto' : '10px',
                  bottom: isMobile ? '50px' : '10px',
                }}
              />
              
              {/* Minimap adattata per mobile */}
              {!isMobile && (
                <MiniMap 
                  nodeColor={(node) => {
                    switch (node.type) {
                      case 'pageNode':
                        return '#FF6B00';
                      case 'eventNode':
                        return '#e74c3c';
                      case 'navigationNode':
                        return '#2ecc71';
                      default:
                        return '#3498db';
                    }
                  }}
                  maskColor="rgba(0, 0, 0, 0.5)"
                  style={{ width: 100, height: 80 }}
                />
              )}
            
            {/* Panel dello zoom per mobile */}
            <Panel position="top-right" className="space-x-1 sm:space-x-2">
              <button 
                onClick={handleZoomIn}
                className="p-1 sm:p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={isMobile ? 14 : 16} />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-1 sm:p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={isMobile ? 14 : 16} />
              </button>
            </Panel>
            
            {/* Legenda mobile-friendly */}
            <Panel position="bottom-left">
              {isMobile ? (
                <button
                  onClick={() => setIsLegendVisible(!isLegendVisible)}
                  className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors"
                  title="Mostra/Nascondi legenda"
                >
                  <MapPin size={16} />
                </button>
              ) : (
                <div className="bg-zinc-800 p-2 rounded border border-zinc-700">
                  <div className="text-xs mb-2">Legenda:</div>
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                      <span className="text-xs">Visualizzazione</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-info mr-2"></div>
                      <span className="text-xs">Interazione</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-success mr-2"></div>
                      <span className="text-xs">Navigazione</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-danger mr-2"></div>
                      <span className="text-xs">Conversione</span>
                    </div>
                  </div>
                </div>
              )}
            </Panel>
            
            {/* Overlay legenda mobile */}
            {isMobile && isLegendVisible && (
              <div className="absolute top-4 left-4 right-4 bg-zinc-800 p-3 rounded border border-zinc-700 z-10">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-medium">Legenda:</div>
                  <button 
                    onClick={() => setIsLegendVisible(false)}
                    className="p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                    <span className="text-xs">Visualizzazione</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-info mr-2"></div>
                    <span className="text-xs">Interazione</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-success mr-2"></div>
                    <span className="text-xs">Navigazione</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-danger mr-2"></div>
                    <span className="text-xs">Conversione</span>
                  </div>
                </div>
              </div>
            )}
          </ReactFlow>
        </div>
      )}
      
      {/* Dettaglio nodo selezionato ottimizzato per mobile */}
      {selectedNode && (
        <div className="p-2 sm:p-4 border-t border-zinc-700 bg-zinc-900/50 overflow-y-auto max-h-[40vh] sm:max-h-none">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center text-sm sm:text-base">
              {selectedNode.type === 'pageNode' ? (
                <Eye size={isMobile ? 14 : 16} className="text-primary mr-2" />
              ) : selectedNode.type === 'eventNode' ? (
                <AlertCircle size={isMobile ? 14 : 16} className="text-danger mr-2" />
              ) : (
                <MousePointer size={isMobile ? 14 : 16} className="text-info mr-2" />
              )}
              {selectedNode.data.detail.type === 'page_view' ? 'Visualizzazione' : 
               selectedNode.data.detail.type === 'event' ? 'Conversione' : 
               'Interazione'}
            </h3>
            <div className="text-xs text-zinc-400">
              {formatDateTime(selectedNode.data.detail.timestamp)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 bg-zinc-800 p-2 sm:p-3 rounded text-sm">
            {selectedNode.data.detail.type === 'page_view' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Titolo</div>
                  <div className="text-sm">{selectedNode.data.detail.data?.title || 'Senza titolo'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">URL</div>
                  <div className="text-sm truncate" title={selectedNode.data.detail.data?.url}>
                    {selectedNode.data.detail.data?.url || 'N/D'}
                  </div>
                </div>
                {selectedNode.data.detail.data?.referrer && (
                  <div className="sm:col-span-2">
                    <div className="text-xs text-zinc-400 mb-1">Referrer</div>
                    <div className="text-sm flex items-center">
                      <ArrowRight size={14} className="text-zinc-500 mr-1" />
                      <span className="truncate">{selectedNode.data.detail.data.referrer}</span>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {selectedNode.data.detail.type === 'click' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Elemento</div>
                  <div className="text-sm">
                    {selectedNode.data.detail.data?.element || 'Non identificato'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Testo</div>
                  <div className="text-sm">
                    {selectedNode.data.detail.data?.text || 'Nessun testo'}
                  </div>
                </div>
                {selectedNode.data.detail.data?.selector && (
                  <div className="sm:col-span-2">
                    <div className="text-xs text-zinc-400 mb-1">Selettore CSS</div>
                    <div className="text-xs bg-zinc-900 p-1 rounded font-mono overflow-x-auto">
                      {selectedNode.data.detail.data.selector}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {selectedNode.data.detail.type === 'scroll' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Direzione</div>
                  <div className="text-sm">{selectedNode.data.detail.data?.direction || 'Non specificata'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Profondità</div>
                  <div className="text-sm">{selectedNode.data.detail.data?.depth || '0'}%</div>
                </div>
              </>
            )}
            
            {selectedNode.data.detail.type === 'form_submit' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Form ID</div>
                  <div className="text-sm">{selectedNode.data.detail.data?.formId || 'Non specificato'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Pagina</div>
                  <div className="text-sm truncate">
                    {selectedNode.data.detail.data?.page || window.location.pathname}
                  </div>
                </div>
              </>
            )}
            
            {selectedNode.data.detail.type === 'event' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Nome evento</div>
                  <div className="text-sm">{selectedNode.data.detail.data?.name || 'Senza nome'}</div>
                </div>
                {selectedNode.data.detail.data?.value && (
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Valore</div>
                    <div className="text-sm">{selectedNode.data.detail.data.value}</div>
                  </div>
                )}
                {selectedNode.data.detail.data?.category && (
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Categoria</div>
                    <div className="text-sm">{selectedNode.data.detail.data.category}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}