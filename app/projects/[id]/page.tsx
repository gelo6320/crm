// app/projects/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Edit, Trash2, Clock, Calendar, Tag, MapPin, 
  User, Phone, Mail, Plus, Image, FileText, FileCheck, 
  ClipboardList, MessageSquare, Save, Loader, Pencil 
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toaster";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api/api-utils';

// Tipi
interface ContactPerson {
  name: string;
  phone: string;
  email: string;
}

interface Document {
  _id?: string;
  name: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
}

interface ProjectImage {
  _id?: string;
  name: string;
  imageUrl: string;
  caption: string;
  uploadDate: string;
}

interface Task {
  _id?: string;
  name: string;
  description: string;
  status: string;
  dueDate: string;
}

interface Note {
  _id?: string;
  text: string;
  createdAt: string;
  createdBy: string;
}

interface Project {
  _id: string;
  name: string;
  client: string;
  address: string;
  description: string;
  startDate: string;
  estimatedEndDate: string;
  status: string;
  budget: number;
  progress: number;
  documents: Document[];
  images: ProjectImage[];
  notes: Note[];
  tasks: Task[];
  contactPerson: ContactPerson;
  createdAt: string;
  updatedAt: string;
}

// Funzioni helper
const formatBudget = (budget: number): string => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(budget);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/D';
  return new Date(dateString).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'N/D';
  return new Date(dateString).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Stato del task con colore
const getTaskStatusBadge = (status: string) => {
  switch (status) {
    case 'da iniziare':
      return <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded">Da iniziare</span>;
    case 'in corso':
      return <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded">In corso</span>;
    case 'completato':
      return <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded">Completato</span>;
    default:
      return <span className="bg-zinc-500/20 text-zinc-400 text-xs px-2 py-0.5 rounded">{status}</span>;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pianificazione': return 'bg-blue-500';
    case 'in corso': return 'bg-green-500';
    case 'in pausa': return 'bg-amber-500';
    case 'completato': return 'bg-purple-500';
    case 'cancellato': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pianificazione': return 'Pianificazione';
    case 'in corso': return 'In corso';
    case 'in pausa': return 'In pausa';
    case 'completato': return 'Completato';
    case 'cancellato': return 'Cancellato';
    default: return status;
  }
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Stati per gli upload
  const [newNote, setNewNote] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentUrl, setNewDocumentUrl] = useState('');
  const [newDocumentType, setNewDocumentType] = useState('');
  const [newImageName, setNewImageName] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');
  
  // Stati per le azioni in corso
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  
  // Stati per modifica rapida
  const [isEditingProgress, setIsEditingProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  
  // Carica i dati del progetto
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/projects/${id}`, { 
            withCredentials: true 
          });
          const data = response.data;
        setProject(data);
        setProgressValue(data.progress);
      } catch (error) {
        console.error('Errore nel recupero del progetto:', error);
        toast("error", "Errore", "Impossibile caricare i dettagli del progetto");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [id]);
  
  // Gestisce l'eliminazione del progetto
  const handleDeleteProject = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo progetto? Questa azione non può essere annullata.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const response = await axios.delete(`${API_BASE_URL}/api/projects/${id}`, { 
        withCredentials: true 
      });
      
      if (response.status !== 200 && response.status !== 204) {
        throw new Error('Errore nell\'eliminazione del progetto');
      }
      
      toast("success", "Progetto eliminato", "Il progetto è stato eliminato con successo");
      router.push('/projects');
    } catch (error) {
      console.error('Errore nell\'eliminazione del progetto:', error);
      toast("error", "Errore", "Si è verificato un errore durante l'eliminazione del progetto");
      setIsDeleting(false);
    }
  };
  
  // Funzione per aggiungere una nota
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      toast("warning", "Campo richiesto", "Inserisci il testo della nota");
      return;
    }
    
    try {
      setIsAddingNote(true);
      const response = await axios.post(`${API_BASE_URL}/api/projects/${id}/notes`, {
        text: newNote
      }, { withCredentials: true });
      const updatedProject = response.data;

      setProject(updatedProject);
      setNewNote('');
      toast("success", "Nota aggiunta", "La nota è stata aggiunta con successo");
    } catch (error) {
      console.error('Errore nell\'aggiunta della nota:', error);
      toast("error", "Errore", "Si è verificato un errore durante l'aggiunta della nota");
    } finally {
      setIsAddingNote(false);
    }
  };
  
  // Funzione per aggiungere un'attività
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskName.trim()) {
      toast("warning", "Campo richiesto", "Inserisci il nome dell'attività");
      return;
    }
    
    try {
      setIsAddingTask(true);
      const response = await axios.post(`${API_BASE_URL}/api/projects/${id}/tasks`, {
        name: newTaskName,
        description: newTaskDescription,
        dueDate: newTaskDueDate
      }, { withCredentials: true });
      const updatedProject = response.data;
      setProject(updatedProject);
      setNewTaskName('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      toast("success", "Attività aggiunta", "L'attività è stata aggiunta con successo");
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'attività:', error);
      toast("error", "Errore", "Si è verificato un errore durante l'aggiunta dell'attività");
    } finally {
      setIsAddingTask(false);
    }
  };
  
  // Funzione per aggiungere un documento
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDocumentName.trim() || !newDocumentUrl.trim()) {
      toast("warning", "Campi richiesti", "Inserisci nome e URL del documento");
      return;
    }
    
    try {
      setIsAddingDocument(true);
      const response = await axios.post(`${API_BASE_URL}/api/projects/${id}/documents`, {
        name: newDocumentName,
        fileUrl: newDocumentUrl,
        fileType: newDocumentType
      }, { withCredentials: true });
      const updatedProject = response.data;

      setProject(updatedProject);
      setNewDocumentName('');
      setNewDocumentUrl('');
      setNewDocumentType('');
      toast("success", "Documento aggiunto", "Il documento è stato aggiunto con successo");
    } catch (error) {
      console.error('Errore nell\'aggiunta del documento:', error);
      toast("error", "Errore", "Si è verificato un errore durante l'aggiunta del documento");
    } finally {
      setIsAddingDocument(false);
    }
  };
  
  // Funzione per aggiungere un'immagine
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newImageName.trim() || !newImageUrl.trim()) {
      toast("warning", "Campi richiesti", "Inserisci nome e URL dell'immagine");
      return;
    }
    
    try {
      setIsAddingImage(true);
      const response = await axios.post(`${API_BASE_URL}/api/projects/${id}/images`, {
        name: newImageName,
        imageUrl: newImageUrl,
        caption: newImageCaption
      }, { withCredentials: true });
      const updatedProject = response.data;

      setProject(updatedProject);
      setNewImageName('');
      setNewImageUrl('');
      setNewImageCaption('');
      toast("success", "Immagine aggiunta", "L'immagine è stata aggiunta con successo");
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'immagine:', error);
      toast("error", "Errore", "Si è verificato un errore durante l'aggiunta dell'immagine");
    } finally {
      setIsAddingImage(false);
    }
  };
  
  // Funzione per aggiornare il progresso rapidamente
  const handleProgressUpdate = async () => {
    try {
      setIsEditingProgress(false);
      
      if (!project) return;
      
      // Aggiorna solo se il valore è cambiato
      if (progressValue === project.progress) return;
      
      const response = await axios.put(`${API_BASE_URL}/api/projects/${id}`, {
        progress: progressValue
      }, { withCredentials: true });
      const updatedProject = response.data;

      setProject(updatedProject);
      toast("success", "Progresso aggiornato", "Il progresso è stato aggiornato con successo");
    } catch (error) {
      console.error('Errore nell\'aggiornamento del progresso:', error);
      toast("error", "Errore", "Si è verificato un errore durante l'aggiornamento del progresso");
    }
  };
  
  // Visualizzazione di caricamento
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Gestione progetto non trovato
  if (!project) {
    return (
      <div className="card p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <Trash2 size={40} className="text-zinc-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Progetto non trovato</h3>
          <p className="text-zinc-400 mb-6">
            Il progetto richiesto non esiste o è stato eliminato.
          </p>
          <Link href="/projects" className="btn btn-primary inline-flex items-center justify-center">
            Torna all'elenco progetti
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-lg font-medium flex items-center">
          <Link href="/projects" className="mr-2 p-1 rounded-full hover:bg-zinc-800">
            <ArrowLeft size={20} />
          </Link>
          <span className="line-clamp-1">{project.name}</span>
        </h1>
        
        <div className="flex items-center space-x-2">
          <Link href={`/projects/${id}/edit`} className="btn btn-outline">
            <Edit size={16} className="mr-1" />
            <span>Modifica</span>
          </Link>
          
          <button 
            onClick={handleDeleteProject}
            disabled={isDeleting}
            className="btn btn-outline border-danger text-danger hover:bg-danger/10"
          >
            {isDeleting ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>
      
      {/* Badge stato */}
      <div className={`inline-flex items-center ${getStatusColor(project.status)} text-white text-sm px-3 py-1 rounded-full mb-6`}>
        {getStatusText(project.status)}
      </div>
      
      {/* Progress bar */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Avanzamento del progetto</span>
          
          {isEditingProgress ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max="100"
                value={progressValue}
                onChange={(e) => setProgressValue(parseInt(e.target.value) || 0)}
                className="input w-20 py-1 text-sm"
              />
              <button 
                onClick={handleProgressUpdate}
                className="btn btn-primary p-1"
              >
                <Save size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{project.progress}%</span>
              <button 
                onClick={() => setIsEditingProgress(true)}
                className="p-1 hover:bg-zinc-700 rounded-full"
              >
                <Pencil size={16} />
              </button>
            </div>
          )}
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2.5">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-700">
        <div className="flex overflow-x-auto space-x-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 relative ${
              activeTab === 'info' 
                ? 'text-primary border-b-2 border-primary font-medium' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Informazioni
          </button>
          
          <button
            onClick={() => setActiveTab('images')}
            className={`py-2 px-1 relative ${
              activeTab === 'images' 
                ? 'text-primary border-b-2 border-primary font-medium' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Immagini {project.images.length > 0 && <span className="ml-1 text-xs">({project.images.length})</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 relative ${
              activeTab === 'documents' 
                ? 'text-primary border-b-2 border-primary font-medium' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Documenti {project.documents.length > 0 && <span className="ml-1 text-xs">({project.documents.length})</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 relative ${
              activeTab === 'tasks' 
                ? 'text-primary border-b-2 border-primary font-medium' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Attività {project.tasks.length > 0 && <span className="ml-1 text-xs">({project.tasks.length})</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-1 relative ${
              activeTab === 'notes' 
                ? 'text-primary border-b-2 border-primary font-medium' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Note {project.notes.length > 0 && <span className="ml-1 text-xs">({project.notes.length})</span>}
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="space-y-6">
        {/* Informazioni principali */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-5 lg:col-span-2">
              <h2 className="text-base font-medium mb-4">Dettagli progetto</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm text-zinc-400 mb-1">Cliente</h3>
                    <p className="font-medium">{project.client}</p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm text-zinc-400 mb-1">Indirizzo</h3>
                    <p className="flex items-start">
                      <MapPin size={16} className="mr-1 mt-0.5 text-zinc-500 flex-shrink-0" />
                      <span>{project.address}</span>
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm text-zinc-400 mb-1">Budget</h3>
                    <p className="flex items-center font-medium">
                      <Tag size={16} className="mr-1 text-primary" />
                      {formatBudget(project.budget)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm text-zinc-400 mb-1">Data inizio</h3>
                    <p className="flex items-center">
                      <Calendar size={16} className="mr-1 text-zinc-500" />
                      {formatDate(project.startDate)}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm text-zinc-400 mb-1">Data fine stimata</h3>
                    <p className="flex items-center">
                      <Calendar size={16} className="mr-1 text-zinc-500" />
                      {formatDate(project.estimatedEndDate)}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-sm text-zinc-400 mb-1">Ultimo aggiornamento</h3>
                    <p className="flex items-center">
                      <Clock size={16} className="mr-1 text-zinc-500" />
                      {formatDateTime(project.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <h3 className="text-sm text-zinc-400 mb-2">Descrizione</h3>
                <p className="text-sm whitespace-pre-wrap">
                  {project.description || 'Nessuna descrizione disponibile'}
                </p>
              </div>
            </div>
            
            <div className="card p-5">
              <h2 className="text-base font-medium mb-4">Contatto referente</h2>
              
              {project.contactPerson && (project.contactPerson.name || project.contactPerson.phone || project.contactPerson.email) ? (
                <div className="space-y-4">
                  {project.contactPerson.name && (
                    <div className="flex items-start">
                      <User size={16} className="mr-2 mt-0.5 text-zinc-500 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-zinc-400">Nome</div>
                        <div>{project.contactPerson.name}</div>
                      </div>
                    </div>
                  )}
                  
                  {project.contactPerson.phone && (
                    <div className="flex items-start">
                      <Phone size={16} className="mr-2 mt-0.5 text-zinc-500 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-zinc-400">Telefono</div>
                        <div>{project.contactPerson.phone}</div>
                      </div>
                    </div>
                  )}
                  
                  {project.contactPerson.email && (
                    <div className="flex items-start">
                      <Mail size={16} className="mr-2 mt-0.5 text-zinc-500 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-zinc-400">Email</div>
                        <div>{project.contactPerson.email}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-500 text-sm">
                  Nessun referente specificato
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Immagini */}
        {activeTab === 'images' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-medium">Immagini del progetto</h2>
              <button 
                onClick={() => setIsAddingImage(!isAddingImage)}
                className="btn btn-outline btn-sm"
              >
                <Plus size={16} className="mr-1" />
                Aggiungi immagine
              </button>
            </div>
            
            {/* Form per aggiungere una nuova immagine */}
            {isAddingImage && (
              <div className="card p-4 mb-6 animate-slide-down">
                <h3 className="text-sm font-medium mb-3">Aggiungi nuova immagine</h3>
                <form onSubmit={handleAddImage} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="newImageName" className="block text-xs font-medium mb-1">
                        Nome immagine <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="newImageName"
                        type="text"
                        value={newImageName}
                        onChange={(e) => setNewImageName(e.target.value)}
                        className="input w-full py-1.5 text-sm"
                        placeholder="Es. Facciata principale"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="newImageUrl" className="block text-xs font-medium mb-1">
                        URL immagine <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="newImageUrl"
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="input w-full py-1.5 text-sm"
                        placeholder="https://esempio.com/immagine.jpg"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="newImageCaption" className="block text-xs font-medium mb-1">
                      Didascalia
                    </label>
                    <input
                      id="newImageCaption"
                      type="text"
                      value={newImageCaption}
                      onChange={(e) => setNewImageCaption(e.target.value)}
                      className="input w-full py-1.5 text-sm"
                      placeholder="Descrivi brevemente l'immagine..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingImage(false)}
                      className="btn btn-outline btn-sm"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingImage && (!newImageName || !newImageUrl)}
                      className="btn btn-primary btn-sm"
                    >
                      {isAddingImage ? (
                        <span className="flex items-center">
                          <Loader size={14} className="animate-spin mr-1" />
                          Caricamento...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Plus size={14} className="mr-1" />
                          Aggiungi
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Visualizzazione immagini */}
            {project.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {project.images.map((image, index) => (
                  <div key={index} className="card overflow-hidden bg-zinc-900 relative">
                  <img 
                    src={image.imageUrl} 
                    alt={image.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-1">{image.name}</h3>
                    {image.caption && (
                      <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{image.caption}</p>
                    )}
                    <p className="text-xs text-zinc-500">
                      {formatDate(image.uploadDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-6 text-center">
              <Image size={40} className="text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400 mb-3">
                Nessuna immagine disponibile per questo progetto.
              </p>
              <button 
                onClick={() => setIsAddingImage(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} className="mr-1" />
                Aggiungi la prima immagine
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Documenti */}
      {activeTab === 'documents' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium">Documenti del progetto</h2>
            <button 
              onClick={() => setIsAddingDocument(!isAddingDocument)}
              className="btn btn-outline btn-sm"
            >
              <Plus size={16} className="mr-1" />
              Aggiungi documento
            </button>
          </div>
          
          {/* Form per aggiungere un nuovo documento */}
          {isAddingDocument && (
            <div className="card p-4 mb-6 animate-slide-down">
              <h3 className="text-sm font-medium mb-3">Aggiungi nuovo documento</h3>
              <form onSubmit={handleAddDocument} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="newDocumentName" className="block text-xs font-medium mb-1">
                      Nome documento <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="newDocumentName"
                      type="text"
                      value={newDocumentName}
                      onChange={(e) => setNewDocumentName(e.target.value)}
                      className="input w-full py-1.5 text-sm"
                      placeholder="Es. Piano di lavoro"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="newDocumentType" className="block text-xs font-medium mb-1">
                      Tipo documento
                    </label>
                    <select
                      id="newDocumentType"
                      value={newDocumentType}
                      onChange={(e) => setNewDocumentType(e.target.value)}
                      className="input w-full py-1.5 text-sm"
                    >
                      <option value="">Seleziona tipo...</option>
                      <option value="PDF">PDF</option>
                      <option value="Word">Word</option>
                      <option value="Excel">Excel</option>
                      <option value="CAD">CAD</option>
                      <option value="Immagine">Immagine</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="newDocumentUrl" className="block text-xs font-medium mb-1">
                    URL documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="newDocumentUrl"
                    type="url"
                    value={newDocumentUrl}
                    onChange={(e) => setNewDocumentUrl(e.target.value)}
                    className="input w-full py-1.5 text-sm"
                    placeholder="https://esempio.com/documento.pdf"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingDocument(false)}
                    className="btn btn-outline btn-sm"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingDocument && (!newDocumentName || !newDocumentUrl)}
                    className="btn btn-primary btn-sm"
                  >
                    {isAddingDocument ? (
                      <span className="flex items-center">
                        <Loader size={14} className="animate-spin mr-1" />
                        Caricamento...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Plus size={14} className="mr-1" />
                        Aggiungi
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Visualizzazione documenti */}
          {project.documents.length > 0 ? (
            <div className="space-y-2">
              {project.documents.map((doc, index) => (
                <div key={index} className="card p-4 flex items-center hover:bg-zinc-800/60 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mr-4">
                    <FileText size={20} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-medium text-sm">{doc.name}</h3>
                    <div className="flex items-center text-xs text-zinc-400 mt-1">
                      {doc.fileType && <span className="bg-zinc-700 px-2 py-0.5 rounded text-xs mr-2">{doc.fileType}</span>}
                      <span>{formatDate(doc.uploadDate)}</span>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm p-1.5 ml-2"
                    title="Apri documento"
                  >
                    <FileCheck size={16} />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-6 text-center">
              <FileText size={40} className="text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400 mb-3">
                Nessun documento disponibile per questo progetto.
              </p>
              <button 
                onClick={() => setIsAddingDocument(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} className="mr-1" />
                Aggiungi il primo documento
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Attività */}
      {activeTab === 'tasks' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium">Attività del progetto</h2>
            <button 
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="btn btn-outline btn-sm"
            >
              <Plus size={16} className="mr-1" />
              Aggiungi attività
            </button>
          </div>
          
          {/* Form per aggiungere una nuova attività */}
          {isAddingTask && (
            <div className="card p-4 mb-6 animate-slide-down">
              <h3 className="text-sm font-medium mb-3">Aggiungi nuova attività</h3>
              <form onSubmit={handleAddTask} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="newTaskName" className="block text-xs font-medium mb-1">
                      Nome attività <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="newTaskName"
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      className="input w-full py-1.5 text-sm"
                      placeholder="Es. Preparazione cantiere"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="newTaskDueDate" className="block text-xs font-medium mb-1">
                      Data scadenza
                    </label>
                    <input
                      id="newTaskDueDate"
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="input w-full py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="newTaskDescription" className="block text-xs font-medium mb-1">
                    Descrizione
                  </label>
                  <textarea
                    id="newTaskDescription"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    rows={2}
                    className="input w-full py-1.5 text-sm"
                    placeholder="Descrivi brevemente l'attività..."
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="btn btn-outline btn-sm"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingTask && !newTaskName}
                    className="btn btn-primary btn-sm"
                  >
                    {isAddingTask ? (
                      <span className="flex items-center">
                        <Loader size={14} className="animate-spin mr-1" />
                        Caricamento...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Plus size={14} className="mr-1" />
                        Aggiungi
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Visualizzazione attività */}
          {project.tasks.length > 0 ? (
            <div className="space-y-3">
              {project.tasks.map((task, index) => (
                <div key={index} className="card p-4 hover:bg-zinc-800/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <h3 className="font-medium">{task.name}</h3>
                    <div className="flex items-center space-x-2">
                      {task.dueDate && (
                        <div className="flex items-center text-xs text-zinc-400">
                          <Calendar size={12} className="mr-1" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      )}
                      <div>{getTaskStatusBadge(task.status)}</div>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-zinc-400 mt-2">{task.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-6 text-center">
              <ClipboardList size={40} className="text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400 mb-3">
                Nessuna attività disponibile per questo progetto.
              </p>
              <button 
                onClick={() => setIsAddingTask(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} className="mr-1" />
                Aggiungi la prima attività
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Note */}
      {activeTab === 'notes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium">Note del progetto</h2>
          </div>
          
          {/* Form per aggiungere una nuova nota */}
          <div className="card p-4 mb-6">
            <h3 className="text-sm font-medium mb-3">Aggiungi nuova nota</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="input w-full py-1.5 text-sm"
                  placeholder="Scrivi una nota..."
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingNote || !newNote.trim()}
                  className="btn btn-primary btn-sm"
                >
                  {isAddingNote ? (
                    <span className="flex items-center">
                      <Loader size={14} className="animate-spin mr-1" />
                      Salvataggio...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <MessageSquare size={14} className="mr-1" />
                      Aggiungi Nota
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Visualizzazione note */}
          {project.notes && project.notes.length > 0 ? (
            <div className="space-y-4">
              {project.notes.slice().reverse().map((note, index) => (
                <div key={index} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-zinc-400">
                      {note.createdBy} - {formatDateTime(note.createdAt)}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-6 text-center">
              <MessageSquare size={40} className="text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400 mb-2">
                Nessuna nota disponibile per questo progetto.
              </p>
              <p className="text-zinc-500 text-sm mb-3">
                Utilizza il form sopra per aggiungere la prima nota.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
}