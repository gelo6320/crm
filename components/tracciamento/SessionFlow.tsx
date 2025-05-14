// SessionFlow.tsx - Versione completa con layout migliorato
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
import dagre from '@dagrejs/dagre';
import 'reactflow/dist/style.css';
import { SessionDetail, UserSession } from '@/types/tracciamento';
import { formatDateTime } from '@/lib/utils/date';
import { formatTime } from '@/lib/utils/format';
import { ArrowLeft, ZoomIn, ZoomOut, MousePointer, Info, AlertCircle, Eye, ArrowRight } from 'lucide-react';

// Importa i tipi di nodi personalizzati
import PageNode from './flow-nodes/PageNode';
import ActionNode from './flow-nodes/ActionNode';
import EventNode from './flow-nodes/EventNode';
import NavigationNode from './flow-nodes/NavigationNode';
import FormNode from './flow-nodes/FormNode'; // Aggiungiamo il nuovo tipo di nodo

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
  formNode: FormNode, // Aggiungi il nuovo tipo
};

// Funzione per applicare il layout Dagre ai nodi
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  // Crea un nuovo grafo Dagre
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Configura il layout con direzione
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 80,     // Spazio orizzontale tra nodi
    ranksep: 150,    // Spazio verticale tra ranghi
    marginx: 50,
    marginy: 50 
  });
  
  // Imposta le dimensioni dei nodi
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 120 });
  });
  
  // Aggiungi edges al grafo
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  // Calcola il layout
  dagre.layout(dagreGraph);
  
  // Aggiorna la posizione dei nodi
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 110, // Centra orizzontalmente
        y: nodeWithPosition.y - 60,  // Centra verticalmente
      },
    };
  });
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
  const flowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);
  
  useEffect(() => {
    if (isLoading) {
      setNoData(false);
      return;
    }
    
    console.log("SessionFlow: Processing session details", { 
      count: sessionDetails?.length || 0, 
      details: sessionDetails 
    });
    
    // Check if there's enough data
    if (!sessionDetails || sessionDetails.length < 2) {
      console.warn("Insufficient data to display flow:", sessionDetails?.length || 0);
      setNoData(true);
      return;
    } else {
      setNoData(false);
    }
    
    // Create initial nodes and edges without positions
    const initialNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // Process each session detail to create nodes
    sessionDetails.forEach((detail, index) => {
      // Determine the node type based on the event type and metadata
      let nodeType = determineNodeType(detail);
      
      // Create the node (without position - will be set by layout algorithm)
      const node: Node = {
        id: detail.id,
        type: nodeType,
        data: { 
          detail,
          label: getNodeLabel(detail)
        },
        position: { x: 0, y: 0 }, // Temporary position
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
      
      initialNodes.push(node);
      
      // Create edge to previous node
      if (index > 0) {
        const timeBetween = getTimeDifference(
          new Date(sessionDetails[index - 1].timestamp),
          new Date(detail.timestamp)
        );
        
        const edge: Edge = {
          id: `edge-${sessionDetails[index - 1].id}-${detail.id}`,
          source: sessionDetails[index - 1].id,
          target: detail.id,
          type: 'smoothstep',  // Modificato da 'step' a 'smoothstep' per un aspetto più fluido
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: '#64748b',
          },
          style: {
            stroke: '#64748b',
            strokeWidth: 2,
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
    
    // Applica il layout Dagre
    const nodesWithLayout = getLayoutedElements(initialNodes, newEdges);
    
    // Imposta i nodi e gli archi
    setNodes(nodesWithLayout);
    setEdges(newEdges);
    
    // Fit view after nodes are created
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.2 });
      }
    }, 200);
    
  }, [sessionDetails, isLoading, setNodes, setEdges]);
  
  // Determina il tipo di nodo in base ai dati dell'evento
  const determineNodeType = (detail: SessionDetail) => {
    // Page views
    if (detail.type === 'page_view' || detail.type === 'pageview') {
      return 'pageNode';
    } 
    // Conversion events - Solo eventi di conversione effettiva o lead specifici
    else if (
      detail.type === 'conversion' || 
      (detail.data?.category === 'conversion')
    ) {
      return 'eventNode';
    }
    // Lead collection specifici - vanno come eventi
    else if (
      (detail.type === 'form_interaction' && 
       detail.data?.interactionType === 'lead_facebook')
    ) {
      return 'eventNode';
    }
    // Tutti gli altri form_interaction vanno nel nuovo tipo formNode
    else if (detail.type === 'form_interaction') {
      return 'formNode';
    }
    // Navigation events
    else if (
      ['scroll', 'page_visibility', 'time_on_page', 'session_end'].includes(detail.type) ||
      (detail.data?.category === 'navigation') ||
      (detail.data?.scrollTypes)
    ) {
      return 'navigationNode';
    }
    // Click events
    else if (
      detail.type === 'click' || 
      (detail.data?.name && detail.data.name.includes('click'))
    ) {
      return 'actionNode';
    }
    
    return 'actionNode'; // Default
  };
  
  const getNodeLabel = (detail: SessionDetail) => {
    const defaultLabel = "Unspecified event";
    
    if (!detail || !detail.type) {
      console.warn("Missing detail or unspecified type", detail);
      return defaultLabel;
    }
    
    try {
      // CORREZIONE: Aggiungi supporto per "pageview" (senza underscore)
      switch (detail.type) {
        // Page views
        case 'page_view':
        case 'pageview':
          if (detail.data?.url) {
            const pageTitle = detail.data.title || new URL(detail.data.url).pathname;
            return `Page View\n${pageTitle}`;
          }
          return `Page View\n${detail.data?.title || 'Unknown page'}`;
        
        // Click events
        case 'click':
          const elementText = detail.data?.elementText || detail.data?.metadata?.elementText || 
                             detail.data?.buttonName || detail.data?.text || '';
          const tagName = detail.data?.tagName || detail.data?.metadata?.tagName || 'element';
          return `Click on ${tagName}\n${elementText.substring(0, 20)}${elementText.length > 20 ? '...' : ''}`;
        
        // Form interactions - improved handling
        case 'form_interaction':
          const interactionType = detail.data?.interactionType || 'interaction';
          
          if (interactionType === 'email_collected') {
            return `Email Collected\n${detail.data?.email || detail.data?.fieldName || ''}`;
          } else if (interactionType === 'phone_collected') {
            return `Phone Collected\n${detail.data?.phone || detail.data?.fieldName || ''}`;
          } else if (interactionType === 'lead_facebook') {
            return `Lead Facebook\n${detail.data?.formData?.email || ''}`;
          } else if (interactionType === 'submit') {
            const formName = detail.data?.formName || 'form';
            return `Form Submit\n${formName}`;
          }
          
          const formName = detail.data?.formName || 'form';
          const fieldName = detail.data?.fieldName ? `\n${detail.data.fieldName}` : '';
          return `Form ${interactionType}\n${formName}${fieldName}`;
        
        // Scroll events - improved with scrollTypes handling
        case 'scroll':
          if (detail.data?.scrollTypes && detail.data.scrollTypes.includes('bottom')) {
            return `Scroll to Bottom\n100%`;
          }
          
          const scrollDepth = detail.data?.percent || detail.data?.metadata?.percent || 
                            detail.data?.depth || detail.data?.scrollDepth || '0';
          return `Scroll\n${scrollDepth}%`;
        
        // Time on page events
        case 'time_on_page':
          const seconds = detail.data?.totalTimeSeconds || detail.data?.timeOnPage || 
                        detail.data?.seconds || detail.data?.metadata?.timeOnPage || 0;
          return `Time on page\n${seconds}s`;
        
        // Page visibility
        case 'page_visibility':
          const isVisible = detail.data?.isVisible !== undefined ? 
                          detail.data.isVisible : 
                          (detail.data?.metadata?.isVisible !== undefined ? 
                           detail.data.metadata.isVisible : false);
          return `Page ${isVisible ? 'visible' : 'hidden'}`;
        
        // Session end
        case 'session_end':
          return `Session end\n${detail.data?.status || ''}`;
        
        // Conversion events - improved with formData handling
        case 'conversion':
        case 'conversion_contact_form':
          const convType = detail.data?.conversionType || 'standard';
          // Extract value and format it if available
          const value = detail.data?.value ? 
              `\n${typeof detail.data.value === 'object' && detail.data.value !== null && 
                '$numberInt' in detail.data.value ? 
                (detail.data.value as any).$numberInt : detail.data.value}€` : '';
          
          // Check for lead form data
          if (detail.data?.isLeadForm || detail.data?.formData) {
            const email = detail.data.formData?.email || '';
            return `Lead Acquisition\n${email}`;
          }
          
          return `Conversion\n${convType}${value}`;
        
        // Generic events - try to extract meaningful information
        default:
          // Check for lead acquisition
          if (detail.data?.name && detail.data.name.includes('lead_acquisition')) {
            const email = detail.data.email || detail.data.formData?.email || '';
            return `Lead acquisition\n${email}`;
          }
          
          // Check for other meaningful data
          if (detail.data?.name) {
            return `${detail.data.name}\n${detail.data.category || ''}`;
          }
          
          return detail.type || defaultLabel;
      }
    } catch (error) {
      console.error("Error generating node label:", error);
      console.error("Problematic detail:", detail);
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
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento dettagli della sessione in corso...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-900/50">
        <h2 className="text-base font-medium">Percorso di Navigazione</h2>
        <button
          onClick={onBack}
          className="btn btn-outline flex items-center space-x-1 py-1 px-2 text-xs"
        >
          <ArrowLeft size={14} />
          <span>Indietro</span>
        </button>
      </div>
      
      {/* Riepilogo sessione */}
      <div className="p-4 border-b border-zinc-700 bg-zinc-800/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium">
              Sessione del {new Date(session.startTime).toLocaleDateString('it-IT')}
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Iniziata alle {new Date(session.startTime).toLocaleTimeString('it-IT')}
              {session.endTime && ` - Terminata alle ${new Date(session.endTime).toLocaleTimeString('it-IT')}`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-zinc-900 rounded">
              <div className="text-xs text-zinc-400">Durata</div>
              <div className="text-lg font-medium text-primary">{formatTime(session.duration)} min</div>
            </div>
            <div className="text-center p-2 bg-zinc-900 rounded">
              <div className="text-xs text-zinc-400">Interazioni</div>
              <div className="text-lg font-medium text-info">{session.interactionsCount}</div>
            </div>
            <div className="text-center p-2 bg-zinc-900 rounded">
              <div className="text-xs text-zinc-400">Pagine viste</div>
              <div className="text-lg font-medium text-success">{session.pagesViewed}</div>
            </div>
          </div>
        </div>
      </div>
      
      {sessionDetails.length === 0 || noData ? (
        <div className="p-8 text-center text-zinc-500">
          <p className="mb-2">Nessun dettaglio disponibile per questa sessione.</p>
          <p className="text-sm">Non sono state registrate interazioni o visualizzazioni di pagina sufficienti.</p>
          <button
            onClick={onBack}
            className="mt-4 btn btn-outline flex items-center mx-auto space-x-1 py-1 px-3 text-xs"
          >
            <ArrowLeft size={14} />
            <span>Torna alle sessioni</span>
          </button>
        </div>
      ) : (
        <div className="flow-wrapper h-full" ref={flowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            attributionPosition="bottom-right"
            onInit={(instance) => {
              reactFlowInstance.current = instance;
              console.log("ReactFlow inizializzato");
              // Importante: usa setTimeout per dare tempo al componente di renderizzare
              setTimeout(() => {
                console.log("Esecuzione fitView");
                if (instance && typeof instance.fitView === 'function') {
                  instance.fitView({ padding: 0.2 });
                }
              }, 300);
            }}
            style={{ width: '100%', height: '100%' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#64748b" gap={16} size={1} />
            <Controls 
              showInteractive={false}
              position="top-right"
              style={{ marginTop: '60px' }}
            />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.type) {
                  case 'pageNode':
                    return '#FF6B00';
                  case 'eventNode':
                    return '#e74c3c';
                  case 'navigationNode':
                    return '#2ecc71';
                  case 'formNode':
                    return '#9c27b0'; // Colore viola per formNode
                  default:
                    return '#3498db';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.5)"
              zoomable
              pannable
            />
          
            <Panel position="top-right" className="space-x-2">
              <button 
                onClick={handleZoomIn}
                className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
            </Panel>
            
            <Panel position="bottom-left">
              <div className="bg-zinc-800 p-2 rounded border border-zinc-700">
                <div className="text-xs mb-2">Legenda:</div>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                    <span className="text-xs">Visualizzazione pagina</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-info mr-2"></div>
                    <span className="text-xs">Interazione</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-xs">Form Interaction</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-success mr-2"></div>
                    <span className="text-xs">Navigazione</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-danger mr-2"></div>
                    <span className="text-xs">Evento di conversione</span>
                  </div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      )}
      
      {/* Dettaglio nodo selezionato */}
      {selectedNode && (
        <div className="p-4 border-t border-zinc-700 bg-zinc-900/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center">
              {selectedNode.type === 'pageNode' ? (
                <Eye size={16} className="text-primary mr-2" />
              ) : selectedNode.type === 'eventNode' ? (
                <AlertCircle size={16} className="text-danger mr-2" />
              ) : selectedNode.type === 'formNode' ? (
                <Info size={16} className="text-purple-500 mr-2" />
              ) : (
                <MousePointer size={16} className="text-info mr-2" />
              )}
              {selectedNode.data.detail.type === 'page_view' ? 'Visualizzazione pagina' : 
               selectedNode.data.detail.type === 'event' ? 'Evento di conversione' :
               selectedNode.data.detail.type === 'form_interaction' ? 'Interazione Form' :
               'Interazione utente'}
            </h3>
            <div className="text-xs text-zinc-400">
              {formatDateTime(selectedNode.data.detail.timestamp)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-800 p-3 rounded">
            {selectedNode.data.detail.type === 'page_view' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Titolo pagina</div>
                  <div className="text-sm">{selectedNode.data.detail.data?.title || 'Senza titolo'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">URL</div>
                  <div className="text-sm truncate" title={selectedNode.data.detail.data?.url}>
                    {selectedNode.data.detail.data?.url || 'N/D'}
                  </div>
                </div>
                {selectedNode.data.detail.data?.referrer && (
                  <div className="md:col-span-2">
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
                  <div className="text-xs text-zinc-400 mb-1">Elemento cliccato</div>
                  <div className="text-sm">
                    {selectedNode.data.detail.data?.element || 'Elemento non identificato'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Testo elemento</div>
                  <div className="text-sm">
                    {selectedNode.data.detail.data?.text || 'Nessun testo'}
                  </div>
                </div>
                {selectedNode.data.detail.data?.selector && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-zinc-400 mb-1">Selettore CSS</div>
                    <div className="text-sm bg-zinc-900 p-1 rounded font-mono text-xs overflow-x-auto">
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
            
            {selectedNode.data.detail.type === 'form_interaction' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Tipo interazione</div>
                  <div className="text-sm">{selectedNode.data.detail.data?.interactionType || 'Non specificato'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Campo</div>
                  <div className="text-sm">{selectedNode.data.detail.data?.fieldName || 'Non specificato'}</div>
                </div>
                {selectedNode.data.detail.data?.formData && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-zinc-400 mb-1">Dati Form</div>
                    <div className="text-sm bg-zinc-900 p-2 rounded">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedNode.data.detail.data.formData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {selectedNode.data.detail.type === 'conversion' && (
              <>
                <div>
                  <div className="text-xs text-zinc-400 mb-1">Tipo conversione</div>
                  <div className="text-sm">{selectedNode.data.detail.data?.conversionType || 'standard'}</div>
                </div>
                {selectedNode.data.detail.data?.value && (
                  <div>
                    <div className="text-xs text-zinc-400 mb-1">Valore</div>
                    <div className="text-sm">{selectedNode.data.detail.data.value}</div>
                  </div>
                )}
                {selectedNode.data.detail.data?.formData && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-zinc-400 mb-1">Dati Lead</div>
                    <div className="text-sm bg-zinc-900 p-2 rounded">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedNode.data.detail.data.formData, null, 2)}
                      </pre>
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