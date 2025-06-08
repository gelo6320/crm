// app/projects/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toaster";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api/api-utils';
import { SmoothCorners } from 'react-smooth-corners';

export default function EditProjectPage({params}: {params: Promise<{ id: string }>}) {
  const router = useRouter();
  const { id } = use(params);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stato del form
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    address: "",
    description: "",
    startDate: "",
    estimatedEndDate: "",
    status: "pianificazione",
    budget: "",
    progress: 0,
    contactPerson: {
      name: "",
      phone: "",
      email: ""
    }
  });
  
  // Carica i dati del progetto
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/projects/${id}`, { 
            withCredentials: true 
          });
          const project = response.data;
        
        // Formatta le date per il form
        const formatDateForInput = (dateString: string) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        setFormData({
          name: project.name || '',
          client: project.client || '',
          address: project.address || '',
          description: project.description || '',
          startDate: formatDateForInput(project.startDate) || '',
          estimatedEndDate: formatDateForInput(project.estimatedEndDate) || '',
          status: project.status || 'pianificazione',
          budget: project.budget?.toString() || '',
          progress: project.progress || 0,
          contactPerson: {
            name: project.contactPerson?.name || '',
            phone: project.contactPerson?.phone || '',
            email: project.contactPerson?.email || ''
          }
        });
      } catch (error) {
        console.error('Errore nel recupero del progetto:', error);
        toast("error", "Errore", "Impossibile caricare i dettagli del progetto");
        router.push(`/projects/${id}`); // Torna alla pagina di dettaglio se c'è un errore
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchProject();
    }
  }, [id, router]);
  
  // Gestione cambiamenti nei campi del form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Gestione campi annidati (es. contactPerson.name)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData] as any,
          [child]: value
        }
      });
    } else {
      // Gestione campi normali
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Formattazione dei dati per l'API
      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        progress: parseInt(formData.progress.toString(), 10) || 0
      };
      
      // Chiamata API per aggiornare il progetto
      const response = await axios.put(`${API_BASE_URL}/api/projects/${id}`, 
        projectData, 
        { withCredentials: true }
      );
      
      if (response.status !== 200 && response.status !== 201) {
        throw new Error('Errore durante l\'aggiornamento del progetto');
      }
      
      // Mostra notifica di successo
      toast("success", "Progetto aggiornato", "Le modifiche sono state salvate con successo");
      
      // Reindirizza alla pagina del progetto
      router.push(`/projects/${id}`);
    } catch (error) {
      console.error('Errore nell\'aggiornamento del progetto:', error);
      toast("error", "Errore", "Si è verificato un errore durante il salvataggio delle modifiche");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Visualizzazione di caricamento
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center">
              <Link 
                href={`/projects/${id}`} 
                className="mr-3 p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              Modifica Progetto
            </h1>
          </div>
        </div>
        
        {/* Form container */}
        <div className="px-4 sm:px-6 pb-8">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm overflow-hidden">
            <SmoothCorners 
              corners="2.5"
              borderRadius="16"
            />
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              {/* Sezione informazioni principali */}
              <div className="space-y-6">
                <div className="pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-white">Informazioni principali</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Dettagli essenziali del progetto</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Nome del progetto <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Es. Ristrutturazione appartamento via Roma"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="client" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="client"
                      name="client"
                      type="text"
                      required
                      value={formData.client}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Es. Mario Rossi"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Indirizzo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Es. Via Roma 123, Milano"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Descrizione
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    placeholder="Descrivi brevemente il progetto..."
                  />
                </div>
              </div>
              
              {/* Sezione tempi e stato */}
              <div className="space-y-6">
                <div className="pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-white">Tempi e Stato</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Pianificazione temporale del progetto</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="startDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Data inizio
                    </label>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="estimatedEndDate" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Data fine stimata
                    </label>
                    <input
                      id="estimatedEndDate"
                      name="estimatedEndDate"
                      type="date"
                      value={formData.estimatedEndDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Stato
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="pianificazione">Pianificazione</option>
                      <option value="in corso">In corso</option>
                      <option value="in pausa">In pausa</option>
                      <option value="completato">Completato</option>
                      <option value="cancellato">Cancellato</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Sezione budget e avanzamento */}
              <div className="space-y-6">
                <div className="pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-white">Budget e Avanzamento</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Aspetti economici e progresso</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="budget" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Budget (€)
                    </label>
                    <input
                      id="budget"
                      name="budget"
                      type="number"
                      min="0"
                      step="100"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Es. 50000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="progress" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Percentuale completamento
                    </label>
                    <div className="space-y-3">
                      <input
                        id="progress"
                        name="progress"
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.progress}
                        onChange={handleChange}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <span>0%</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{formData.progress}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sezione referente */}
              <div className="space-y-6">
                <div className="pb-3 border-b border-zinc-200 dark:border-zinc-700">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-white">Referente</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Persona di riferimento per il progetto</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="contactPerson.name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Nome referente
                    </label>
                    <input
                      id="contactPerson.name"
                      name="contactPerson.name"
                      type="text"
                      value={formData.contactPerson.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Es. Mario Rossi"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="contactPerson.phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Telefono
                    </label>
                    <input
                      id="contactPerson.phone"
                      name="contactPerson.phone"
                      type="tel"
                      value={formData.contactPerson.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Es. 3471234567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="contactPerson.email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Email
                    </label>
                    <input
                      id="contactPerson.email"
                      name="contactPerson.email"
                      type="email"
                      value={formData.contactPerson.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="Es. mario.rossi@email.com"
                    />
                  </div>
                </div>
              </div>
              
              {/* Pulsanti */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                <Link 
                  href={`/projects/${id}`} 
                  className="w-full sm:w-auto px-6 py-3 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 font-medium rounded-xl transition-all text-center"
                >
                  Annulla
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-all inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader size={16} className="animate-spin mr-3" />
                      Salvataggio...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save size={16} className="mr-2" />
                      Salva Modifiche
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}