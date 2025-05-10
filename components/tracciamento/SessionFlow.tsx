// SessionFlow.tsx

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
import { ArrowLeft, ZoomIn, ZoomOut, MousePointer, Info, AlertCircle, Eye, ArrowRight, ChevronLeft } from 'lucide-react';

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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [noData, setNoData] = useState(false);
  const flowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);
  
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
      
      // Crea il nodo
      const node: Node = {
        id: detail.id,
        type: nodeType,
        data: { 
          detail,
          label: getNodeLabel(detail)
        },
        position: { x: 250 * (index % 2), y: 120 * index },
        style: {
          border: nodeBorder,
          borderRadius: '5px',
          backgroundColor: nodeBackground,
          color: nodeTextColor,
          fontWeight: 500,
          padding: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
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
          labelStyle: { fill: '#94a3b8', fontWeight: 500 },
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
        reactFlowInstance.current.fitView({ padding: 0.2 });
      }
    }, 100);
  }, [sessionDetails, isLoading, setNodes, setEdges]);
  
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
            return `Visualizzazione Pagina\n${pageTitle}`;
          }
          return `Visualizzazione Pagina\n${detail.data?.title || 'Pagina sconosciuta'}`;
        
        // ===== CLICK DIRETTI =====
        case 'click':
          // Verifica la struttura dei dati del click
          if (detail.data?.tagName) {
            return `Click su ${detail.data.tagName}\n${detail.data.text || 'elemento'}`;
          } else if (detail.data?.formId) {
            return `Click su Campo Form\n${detail.data.element || 'campo'}`;
          } else if (detail.data?.selector && detail.data.selector.includes('form')) {
            return `Click su Form\n${detail.data.element || 'elemento'}`;
          } else if (detail.data?.isNavigation) {
            return `Click Navigazione\n${detail.data.element || 'link'}`;
          } else if (detail.data?.text) {
            return `Click su Elemento\n${detail.data.text}`;
          }
          return `Click su Elemento\n${detail.data?.element || 'elemento'}`;
        
        // ===== SCROLL DIRETTI =====
        case 'scroll':
          const direction = detail.data?.direction === 'up' ? 'verso l\'alto' : 'verso il basso';
          return `Navigazione: Scroll ${direction}\nProfondità: ${detail.data?.depth || detail.data?.percent || '?'}%`;
        
        // ===== TEMPO SULLA PAGINA DIRETTI =====
        case 'time_on_page':
          return `Navigazione: Tempo sulla Pagina\nDurata: ${formatTime(detail.data?.duration || detail.data?.seconds || 0)}`;
          
        // ===== EXIT INTENT DIRETTI =====
        case 'exit_intent':
          return `Navigazione: Exit Intent\nUtente in uscita`;
        
        // ===== FORM SUBMIT DIRETTI =====
        case 'form_submit':
          if (detail.data?.formId) {
            return `Invio Form\n${detail.data.formId}`;
          }
          return `Invio Form\n${detail.data?.page || 'pagina'}`;
        
        // ===== EVENTI GENERICI =====
        case 'event':
          // ----- CLICK GENERICI -----
          if (detail.data?.name === 'generic_click' || (detail.data?.tagName && detail.data?.text)) {
            const tagName = detail.data?.tagName || 'elemento';
            const text = detail.data?.text || '';
            return `Click su ${tagName}\n${text}`;
          }
          
          // ----- EMAIL COMPILATA -----
          if (detail.data?.fieldName === 'email') {
            return `Campo Email Compilato\n${detail.data.form || 'Form'}`;
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
            
            return `Conversione\n${conversionType}${value ? ` (${value})` : ''}`;
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
                      ? 'Dati anonimi' 
                      : 'Email raccolto';
            } else {
              leadInfo = 'Lead acquisito';
            }
            
            return `Acquisizione Lead\n${leadInfo}`;
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
              return `Navigazione: Fine Pagina\nScroll 100%`;
            }
            
            return `Navigazione: Scroll\nProfondità: ${depth}%`;
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
            
            return `Navigazione: Tempo Pagina\nDurata: ${seconds}s`;
          }
          
          // Visibilità pagina
          if (detail.data?.name === 'page_visibility' || detail.data?.visible !== undefined) {
            const isVisible = detail.data?.visible || 
                            (detail.data?.data?.visible);
            
            return `Navigazione: Visibilità\n${isVisible ? 'Pagina visibile' : 'Pagina nascosta'}`;
          }
          
          // Fine sessione
          if (detail.data?.name === 'session_end' || detail.data?.totalTimeOnPage) {
            const totalTime = detail.data?.totalTimeOnPage || 
                            detail.data?.data?.totalTimeOnPage || 
                            0;
            
            const pageViews = detail.data?.pageViews || 
                            detail.data?.data?.pageViews || 
                            1;
            
            return `Navigazione: Fine Sessione\nPagine: ${pageViews}, Tempo: ${totalTime}s`;
          }
          
          // Exit intent
          if (detail.data?.name && detail.data.name.includes('exit_intent')) {
            return `Navigazione: Exit Intent\nUtente in uscita`;
          }
          
          // ----- EVENTI MEDIA -----
          if (detail.data?.category === 'media' || 
              (detail.data?.name && 
                (detail.data.name.includes('video') || 
                 detail.data.name.includes('audio')))) {
            
            let mediaType = 'Media';
            let action = 'Interazione';
            
            if (detail.data?.name) {
              if (detail.data.name.includes('video')) mediaType = 'Video';
              if (detail.data.name.includes('audio')) mediaType = 'Audio';
              if (detail.data.name.includes('start')) action = 'Avvio';
              if (detail.data.name.includes('progress')) action = 'Progresso';
              if (detail.data.name.includes('complete')) action = 'Completato';
              if (detail.data.name.includes('pause')) action = 'Pausa';
            }
            
            const progress = detail.data?.progress || 
                           detail.data?.data?.progress || 
                           '?';
            
            return `${mediaType}: ${action}\nProgresso: ${progress}%`;
          }
          
          // ----- EVENTI FUNNEL -----
          if (detail.data?.name === 'funnel_progression' || 
              detail.data?.funnelName || 
              (detail.data?.fromStep !== undefined && detail.data?.toStep !== undefined)) {
            
            const funnelName = detail.data?.funnelName || 'principale';
            const toStep = detail.data?.toStep || 
                         detail.data?.data?.toStep || 
                         '?';
            
            return `Funnel: Passaggio\n${funnelName} → Step ${toStep}`;
          }
          
          // ----- ALTRI EVENTI CON NOME -----
          if (detail.data?.name) {
            if (detail.data?.category) {
              return `Evento: ${detail.data.name}\n${detail.data.category}`;
            }
            return `Evento\n${detail.data.name}`;
          } else if (detail.data?.eventName) {
            if (detail.data?.category) {
              return `Evento: ${detail.data.eventName}\n${detail.data.category}`;
            }
            return `Evento\n${detail.data.eventName}`;
          }
          
          // Fallback
          return `Evento\n${detail.data?.type || 'generico'}`;
        
        // ===== FALLBACK PER ALTRI TIPI =====
        default:
          if (detail.data?.name) {
            return `${detail.type}\n${detail.data.name}`;
          } else if (detail.data?.eventName) {
            return `${detail.type}\n${detail.data.eventName}`;
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
  }, []);
  
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
      <div className="p-8 text-center text-zinc-400">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento dettagli della sessione...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Header - CORREZIONE: Breadcrumb che non straborda */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-zinc-700 bg-zinc-800">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-2 hover:bg-zinc-700 rounded transition-colors flex-shrink-0"
            aria-label="Torna indietro"
          >
            <ChevronLeft size={20} className="text-zinc-400" />
          </button>
          <h2 className="text-sm md:text-base font-medium text-white truncate">Percorso Navigazione</h2>
        </div>
        
        <button
          onClick={onBack}
          className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors text-sm flex-shrink-0"
        >
          <ArrowLeft size={14} />
          <span>Indietro</span>
        </button>
      </div>
      
      {/* Session Summary */}
      <div className="px-3 md:px-4 py-3 border-b border-zinc-700 bg-zinc-800/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="col-span-2">
            <div className="text-sm font-medium text-white">
              {new Date(session.startTime).toLocaleDateString('it-IT', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-xs text-zinc-400">
              {new Date(session.startTime).toLocaleTimeString('it-IT', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
              {session.endTime && (
                <span> - {new Date(session.endTime).toLocaleTimeString('it-IT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              )}
            </div>
          </div>
          
          <div className="text-center p-2 bg-zinc-900/50 rounded">
            <div className="text-xs text-zinc-400">Durata</div>
            <div className="text-sm font-medium text-orange-400">
              {formatTime(session.duration)} min
            </div>
          </div>
          
          <div className="text-center p-2 bg-zinc-900/50 rounded">
            <div className="text-xs text-zinc-400">Interazioni</div>
            <div className="text-sm font-medium text-blue-400">
              {session.interactionsCount}
            </div>
          </div>
          
          <div className="text-center p-2 bg-zinc-900/50 rounded">
            <div className="text-xs text-zinc-400">Pagine</div>
            <div className="text-sm font-medium text-green-400">
              {session.pagesViewed}
            </div>
          </div>
          
          <div className="text-center p-2 bg-zinc-900/50 rounded">
            <div className="text-xs text-zinc-400">Eventi</div>
            <div className="text-sm font-medium text-purple-400">
              {sessionDetails.length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Flow Container - CORREZIONE: Garantisce il rendering del flow */}
      {sessionDetails.length === 0 || noData ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-zinc-500">
          <div>
            <p className="mb-4">Nessun dettaglio disponibile per visualizzare il flow.</p>
            <p className="text-sm text-zinc-600 mb-6">
              Almeno 2 eventi sono necessari per generare il percorso di navigazione.
            </p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors text-sm"
            >
              Torna alle sessioni
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full h-full min-h-0 overflow-hidden" style={{ contain: 'layout style size' }}>
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
              console.log('ReactFlow initialized');
              setTimeout(() => {
                console.log('Executing fitView');
                if (instance && typeof instance.fitView === 'function') {
                  instance.fitView({ padding: 0.2 });
                }
              }, 300);
            }}
            className="w-full h-full"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#27272a" gap={16} size={1} />
            <Controls 
              showInteractive={false}
              className="bg-zinc-800 border-zinc-700"
            />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'pageNode': return '#FF6B00';
                  case 'eventNode': return '#e74c3c';
                  case 'navigationNode': return '#2ecc71';
                  default: return '#3498db';
                }
              }}
              position="bottom-right"
              maskColor="rgba(0, 0, 0, 0.7)"
              className="!bg-zinc-800 !border-zinc-700"
            />
            
            {/* Controls Panel */}
            <Panel position="top-right" className="space-x-2">
              <button 
                onClick={handleZoomIn}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors border border-zinc-700"
                title="Zoom in"
              >
                <ZoomIn size={16} className="text-zinc-300" />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors border border-zinc-700"
                title="Zoom out"
              >
                <ZoomOut size={16} className="text-zinc-300" />
              </button>
            </Panel>
            
            {/* Legend */}
            <Panel position="bottom-left" className="hidden md:block">
              <div className="bg-zinc-800/90 backdrop-blur-sm p-3 rounded border border-zinc-700">
                <div className="text-xs font-medium text-zinc-300 mb-2">Legenda</div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span className="text-xs text-zinc-400">Pagina</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-xs text-zinc-400">Azione</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-xs text-zinc-400">Navigazione</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-xs text-zinc-400">Conversione</span>
                  </div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      )}
      
      {/* Node Details Panel */}
      {selectedNode && (
        <div className="border-t border-zinc-700 bg-zinc-800 p-3 md:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              {selectedNode.type === 'pageNode' ? (
                <Eye size={16} className="text-orange-500 mr-2" />
              ) : selectedNode.type === 'eventNode' ? (
                <AlertCircle size={16} className="text-red-500 mr-2" />
              ) : selectedNode.type === 'navigationNode' ? (
                <ArrowRight size={16} className="text-green-500 mr-2" />
              ) : (
                <MousePointer size={16} className="text-blue-500 mr-2" />
              )}
              <h3 className="font-medium text-white text-sm md:text-base">
                {selectedNode.type === 'pageNode' ? 'Visualizzazione Pagina' : 
                 selectedNode.type === 'eventNode' ? 'Evento di Conversione' :
                 selectedNode.type === 'navigationNode' ? 'Navigazione' :
                 'Interazione'}
              </h3>
            </div>
            <div className="text-xs text-zinc-400">
              {formatDateTime(selectedNode.data.detail.timestamp)}
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="md:hidden p-1 hover:bg-zinc-700 rounded"
            >
              <ArrowLeft size={16} className="text-zinc-400" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-900/50 p-3 rounded border border-zinc-700">
            {selectedNode.data.detail.type === 'page_view' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Titolo</div>
                  <div className="text-sm text-white truncate">
                    {selectedNode.data.detail.data?.title || 'Senza titolo'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">URL</div>
                  <div className="text-sm text-white truncate" title={selectedNode.data.detail.data?.url}>
                    {selectedNode.data.detail.data?.url || 'N/D'}
                  </div>
                </div>
                {selectedNode.data.detail.data?.referrer && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-zinc-400 mb-1">Provenienza</div>
                    <div className="text-sm text-white truncate">
                      {selectedNode.data.detail.data.referrer}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {selectedNode.data.detail.type === 'click' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Elemento</div>
                  <div className="text-sm text-white">
                    {selectedNode.data.detail.data?.element || 'Non identificato'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Testo</div>
                  <div className="text-sm text-white">
                    {selectedNode.data.detail.data?.text || 'Nessun testo'}
                  </div>
                </div>
                {selectedNode.data.detail.data?.selector && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-zinc-400 mb-1">Selettore</div>
                    <div className="text-sm font-mono bg-zinc-900 p-2 rounded text-green-400 overflow-x-auto">
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
                  <div className="text-sm text-white">
                    {selectedNode.data.detail.data?.direction || 'Non specificata'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Profondità</div>
                  <div className="text-sm text-white">
                    {selectedNode.data.detail.data?.depth || '0'}%
                  </div>
                </div>
              </>
            )}
            
            {selectedNode.data.detail.type === 'event' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Nome evento</div>
                  <div className="text-sm text-white">
                    {selectedNode.data.detail.data?.name || 'Senza nome'}
                  </div>
                </div>
                {selectedNode.data.detail.data?.value && (
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Valore</div>
                    <div className="text-sm text-white">
                      {selectedNode.data.detail.data.value}
                    </div>
                  </div>
                )}
                {selectedNode.data.detail.data?.category && (
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Categoria</div>
                    <div className="text-sm text-white">
                      {selectedNode.data.detail.data.category}
                    </div>
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