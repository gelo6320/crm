// app/projects/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/toaster";
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api/api-utils';

export default function NewProjectPage() {
  const router = useRouter();
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
      
      // Chiamata API per creare il progetto
      const response = await axios.post(`${API_BASE_URL}/api/projects`, 
        projectData, 
        { withCredentials: true }
      );
      const result = response.data;
      
      // Mostra notifica di successo
      toast("success", "Progetto creato", "Il progetto è stato creato con successo");
      
      // Reindirizza alla pagina del progetto
      router.push(`/projects/${result._id}`);
    } catch (error) {
      console.error('Errore nella creazione del progetto:', error);
      toast("error", "Errore", "Si è verificato un errore durante la creazione del progetto");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-medium flex items-center">
          <Link href="/projects" className="mr-2 p-1 rounded-full hover:bg-zinc-800">
            <ArrowLeft size={20} />
          </Link>
          Nuovo Progetto
        </h1>
      </div>
      
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sezione informazioni principali */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium border-b border-zinc-700 pb-2 mb-4">Informazioni principali</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Nome del progetto <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Es. Ristrutturazione appartamento via Roma"
                />
              </div>
              
              <div>
                <label htmlFor="client" className="block text-sm font-medium mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  id="client"
                  name="client"
                  type="text"
                  required
                  value={formData.client}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Es. Mario Rossi"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                Indirizzo <span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                value={formData.address}
                onChange={handleChange}
                className="input w-full"
                placeholder="Es. Via Roma 123, Milano"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Descrizione
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="input w-full"
                placeholder="Descrivi brevemente il progetto..."
              />
            </div>
          </div>
          
          {/* Sezione tempi e stato */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium border-b border-zinc-700 pb-2 mb-4">Tempi e Stato</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium mb-1">
                  Data inizio
                </label>
                <div className="relative">
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="input w-full pl-10"
                  />
                  <Calendar 
                    size={18} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" 
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="estimatedEndDate" className="block text-sm font-medium mb-1">
                  Data fine stimata
                </label>
                <div className="relative">
                  <input
                    id="estimatedEndDate"
                    name="estimatedEndDate"
                    type="date"
                    value={formData.estimatedEndDate}
                    onChange={handleChange}
                    className="input w-full pl-10"
                  />
                  <Calendar 
                    size={18} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" 
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-1">
                  Stato
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input w-full"
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
          <div className="space-y-4">
            <h2 className="text-sm font-medium border-b border-zinc-700 pb-2 mb-4">Budget e Avanzamento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium mb-1">
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
                  className="input w-full"
                  placeholder="Es. 50000"
                />
              </div>
              
              <div>
                <label htmlFor="progress" className="block text-sm font-medium mb-1">
                  Percentuale completamento
                </label>
                <input
                  id="progress"
                  name="progress"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress}
                  onChange={handleChange}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>0%</span>
                  <span>{formData.progress}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sezione referente */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium border-b border-zinc-700 pb-2 mb-4">Referente</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="contactPerson.name" className="block text-sm font-medium mb-1">
                  Nome referente
                </label>
                <input
                  id="contactPerson.name"
                  name="contactPerson.name"
                  type="text"
                  value={formData.contactPerson.name}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Es. Mario Rossi"
                />
              </div>
              
              <div>
                <label htmlFor="contactPerson.phone" className="block text-sm font-medium mb-1">
                  Telefono
                </label>
                <input
                  id="contactPerson.phone"
                  name="contactPerson.phone"
                  type="tel"
                  value={formData.contactPerson.phone}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Es. 3471234567"
                />
              </div>
              
              <div>
                <label htmlFor="contactPerson.email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="contactPerson.email"
                  name="contactPerson.email"
                  type="email"
                  value={formData.contactPerson.email}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Es. mario.rossi@email.com"
                />
              </div>
            </div>
          </div>
          
          {/* Pulsanti */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-zinc-700">
            <Link href="/projects" className="btn btn-outline">
              Annulla
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary inline-flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creazione in corso...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save size={18} className="mr-2" />
                  Crea Progetto
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}