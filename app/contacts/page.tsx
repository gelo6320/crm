"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Users, Phone, MessageCircle, Globe, ChevronDown, Filter } from "lucide-react"
import { animate, motion, AnimatePresence } from "motion/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com"
import { useRouter } from "next/navigation"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import StatusBadge from "@/components/ui/StatusBadge"
import Pagination from "@/components/ui/Pagination"
import { formatDate } from "@/lib/utils/date"
import { toast } from "@/components/ui/toaster"

// Smooth scroll functions
function smoothScrollToElement(element: HTMLElement, duration = 800) {
  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  })
}

function motionSmoothScrollToElement(element: HTMLElement, duration = 800) {
  const elementRect = element.getBoundingClientRect()
  const absoluteElementTop = elementRect.top + window.scrollY
  const middle = absoluteElementTop - window.innerHeight / 2 + elementRect.height / 2

  animate(window.scrollY, middle, {
    duration: duration / 1000,
    ease: "easeInOut",
    onUpdate: (value) => {
      window.scrollTo(0, value)
    },
  })
}

// Contact interface
interface Contact {
  _id: string
  leadId?: string
  name: string
  firstName?: string
  lastName?: string
  email: string
  phone: string
  source: string
  formType: string
  status: string
  createdAt: string
  updatedAt?: string
  message?: string
  service?: string
  value?: number
  extendedData?: {
    formData?: {
      message?: string
      service?: string
    }
    value?: number
  }
}

interface ContactDetailModalProps {
  contact: Contact
  onClose: () => void
  triggerRect?: DOMRect | null
}

function formatSource(source: string, formType: string): string {
  if (source === "facebook") return "Facebook"
  if (formType === "booking") return "Prenotazione"
  if (source) return source
  if (formType === "form" || formType === "contact") return "Form di contatto"
  return "Sconosciuto"
}

// Enhanced Contact Detail Modal
function ContactDetailModal({ contact, onClose, triggerRect }: ContactDetailModalProps) {
  const [isClosing, setIsClosing] = useState(false)

  const getAnimationCoordinates = () => {
    if (!triggerRect) {
      return {
        initial: { x: 0, y: 0, scale: 0.1, opacity: 1 },
        animate: { x: 0, y: 0, scale: 1, opacity: 1 },
      }
    }

    const triggerCenterX = triggerRect.left + triggerRect.width / 2
    const triggerCenterY = triggerRect.top + triggerRect.height / 2
    const finalX = window.innerWidth / 2
    const finalY = window.innerHeight / 2

    return {
      initial: {
        x: triggerCenterX - finalX,
        y: triggerCenterY - finalY,
        scale: 0.1,
        opacity: 1,
      },
      animate: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
      },
    }
  }

  const coords = getAnimationCoordinates()

  const handleClose = () => {
    setIsClosing(true)
    onClose()
  }

  const springConfig = {
    type: "spring" as const,
    damping: isClosing ? 35 : 25,
    stiffness: isClosing ? 400 : 300,
    mass: 0.8,
  }

  const handleCall = () => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`
    } else {
      toast("error", "Numero non disponibile", "Questo contatto non ha un numero di telefono.")
    }
  }

  const handleWhatsApp = () => {
    if (contact.phone) {
      const formattedPhone = contact.phone.replace(/\s+/g, "").replace(/[()-]/g, "")
      window.open(
        `https://wa.me/${formattedPhone.startsWith("+") ? formattedPhone.substring(1) : formattedPhone}`,
        "_blank",
      )
    } else {
      toast("error", "Numero non disponibile", "Questo contatto non ha un numero di telefono.")
    }
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [])

  const message = contact.extendedData?.formData?.message || contact.message || ""
  const service = contact.service || contact.extendedData?.formData?.service || ""
  const value = contact.value !== undefined ? contact.value : contact.extendedData?.value || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      {/* Enhanced backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={springConfig}
      />

      {/* Enhanced modal container */}
      <motion.div
        className="relative z-10 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={coords.initial}
        animate={coords.animate}
        exit={{
          ...coords.initial,
          scale: 0.1,
          opacity: 0,
        }}
        transition={springConfig}
        style={{ transformOrigin: "center center" }}
      >
        <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
          {/* Enhanced header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50">
            <div className="flex items-center gap-4">
              <div className="scale-90">
                <StatusBadge status={contact.status} />
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {formatSource(contact.source, contact.formType)}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="px-8 py-8 space-y-8">
            {/* Enhanced contact header */}
            <div className="flex items-start space-x-6">
              {contact.source === "facebook" ? (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 287.56 191"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <path
                      fill="currentColor"
                      d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Globe className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                  {contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                </h2>
                <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">{contact.email}</p>
              </div>
            </div>

            {/* Enhanced contact info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Telefono
                </p>
                <p className="text-lg text-gray-900 dark:text-white font-medium">
                  {contact.phone || "Non disponibile"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Data creazione
                </p>
                <p className="text-lg text-gray-900 dark:text-white font-medium">{formatDate(contact.createdAt)}</p>
              </div>

              {service && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Servizio
                  </p>
                  <p className="text-lg text-gray-900 dark:text-white font-medium">{service}</p>
                </div>
              )}

              {value !== undefined && value > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Valore
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    €{value.toLocaleString("it-IT")}
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced message section */}
            {message && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Messaggio
                </p>
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-gray-200/50 dark:border-gray-600/50">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{message}</p>
                </div>
              </div>
            )}

            {/* Enhanced action buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCall}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <Phone className="w-5 h-5" />
                Chiama
              </button>

              <button
                onClick={handleWhatsApp}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactTriggerRect, setContactTriggerRect] = useState<DOMRect | null>(null)
  const [highlightedContactId, setHighlightedContactId] = useState<string | null>(null)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Load contacts on mount and filter changes
  useEffect(() => {
    loadContacts()
  }, [currentPage, selectedStatus])

  const highlightAndScrollToContact = (contactId: string) => {
    if (selectedContact) {
      setSelectedContact(null)
      setContactTriggerRect(null)
    }

    const targetContact = contacts.find((contact) => contact._id === contactId || contact.leadId === contactId)

    if (targetContact) {
      setHighlightedContactId(contactId)

      setTimeout(() => {
        let element = document.getElementById(`contact-${contactId}`)

        if (!element && targetContact.leadId) {
          element = document.getElementById(`contact-${targetContact.leadId}`)
        }

        if (!element) {
          element = document.querySelector(`[data-lead-id="${contactId}"]`) as HTMLElement
        }

        if (element) {
          smoothScrollToElement(element, 1000)
        }

        setTimeout(() => {
          setHighlightedContactId(null)
          if (element) {
            const rect = element.getBoundingClientRect()
            setTimeout(() => {
              setContactTriggerRect(rect)
              setSelectedContact(targetContact)
            }, 50)
          }
        }, 1200)
      }, 100)
    }

    setTimeout(() => {
      if (window.history.replaceState) {
        const url = new URL(window.location.href)
        url.searchParams.delete("id")
        url.searchParams.delete("t")
        window.history.replaceState({}, document.title, url.toString())
      }
    }, 500)
  }

  // Event listeners for search and URL changes
  useEffect(() => {
    const handleSearchResultSelected = (event: CustomEvent) => {
      const { id } = event.detail
      if (id) {
        highlightAndScrollToContact(id)
      }
    }

    window.addEventListener("searchResultSelected", handleSearchResultSelected as EventListener)

    return () => {
      window.removeEventListener("searchResultSelected", handleSearchResultSelected as EventListener)
    }
  }, [contacts])

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const contactId = params.get("id")

      if (contactId && contacts.length > 0) {
        highlightAndScrollToContact(contactId)
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [contacts])

  useEffect(() => {
    if (!isLoading && contacts.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const contactId = params.get("id")

      if (contactId) {
        highlightAndScrollToContact(contactId)
      }
    }
  }, [contacts, isLoading])

  const loadContacts = async () => {
    try {
      setIsLoading(true)

      const queryParams = new URLSearchParams()
      queryParams.append("page", currentPage.toString())
      if (selectedStatus) queryParams.append("status", selectedStatus)

      const response = await fetch(`${API_BASE_URL}/api/leads?${queryParams.toString()}`, {
        credentials: "include",
      })
      const result = await response.json()

      if (result.success) {
        const transformedContacts: Contact[] = result.data.map((lead: any) => ({
          _id: lead._id,
          leadId: lead.leadId,
          name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.name || "Contatto",
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email || "",
          phone: lead.phone || "",
          source: lead.source || "",
          formType: lead.formType || "form",
          status: lead.status || "new",
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          message: lead.message || lead.extendedData?.formData?.message || "",
          service: lead.service || lead.extendedData?.formData?.service || "",
          value: lead.value !== undefined ? lead.value : lead.extendedData?.value || 0,
          extendedData: lead.extendedData,
        }))

        setContacts(transformedContacts)
        setTotalPages(Math.ceil(result.pagination.total / result.pagination.limit) || 1)
      } else {
        toast("error", "Errore", "Impossibile caricare i contatti")
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error loading contacts:", error)
      setIsLoading(false)
      toast("error", "Errore", "Impossibile caricare i contatti")
    }
  }

  const handleContactClick = (contact: Contact, event: React.MouseEvent) => {
    if (selectedContact) {
      setSelectedContact(null)
      setContactTriggerRect(null)
    }

    const targetElement = event.currentTarget as HTMLElement
    const rect = targetElement.getBoundingClientRect()

    setTimeout(() => {
      setContactTriggerRect(rect)
      setSelectedContact(contact)
    }, 10)
  }

  const getSourceIcon = (contact: Contact) => {
    if (contact.source === "facebook") {
      return (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <svg
            className="w-5 h-5 text-white"
            fill="currentColor"
            viewBox="0 0 287.56 191"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              fill="currentColor"
              d="M31.06,126c0,11,2.41,19.41,5.56,24.51A19,19,0,0,0,53.19,160c8.1,0,15.51-2,29.79-21.76,11.44-15.83,24.92-38,34-52l15.36-23.6c10.67-16.39,23-34.61,37.18-47C181.07,5.6,193.54,0,206.09,0c21.07,0,41.14,12.21,56.5,35.11,16.81,25.08,25,56.67,25,89.27,0,19.38-3.82,33.62-10.32,44.87C271,180.13,258.72,191,238.13,191V160c17.63,0,22-16.2,22-34.74,0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16c-18.2,32.27-22.81,39.62-31.91,51.75C84.74,183,71.12,191,53.19,191c-21.27,0-34.72-9.21-43-23.09C3.34,156.6,0,141.76,0,124.85Z"
            />
          </svg>
        </div>
      )
    } else {
      return (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Globe className="w-5 h-5 text-white" />
        </div>
      )
    }
  }

  const getActiveFilterLabel = () => {
    if (selectedStatus) {
      switch (selectedStatus) {
        case "new":
          return "Nuovi"
        case "contacted":
          return "Contattati"
        case "qualified":
          return "Qualificati"
        case "opportunity":
          return "Opportunità"
        case "customer":
          return "Clienti"
        case "lost":
          return "Persi"
        default:
          return selectedStatus
      }
    }
    return "Tutti gli stati"
  }

  const statusFilters = [
    { key: "", label: "Tutti" },
    { key: "new", label: "Nuovi" },
    { key: "contacted", label: "Contattati" },
    { key: "qualified", label: "Qualificati" },
    { key: "opportunity", label: "Opportunità" },
    { key: "customer", label: "Clienti" },
    { key: "lost", label: "Persi" },
  ]

  if (isLoading && contacts.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full">
        {/* Enhanced page header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contatti</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Gestisci i tuoi lead e contatti</p>
              </div>

              {/* Enhanced filter dropdown */}
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="w-full sm:w-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-6 py-3 text-left flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md min-w-[200px]"
                >
                  <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{getActiveFilterLabel()}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isFilterDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isFilterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 sm:right-auto sm:w-64 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-2">
                      {statusFilters.map((filter) => (
                        <button
                          key={filter.key}
                          onClick={() => {
                            setSelectedStatus(filter.key)
                            setCurrentPage(1)
                            setIsFilterDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                            selectedStatus === filter.key
                              ? "bg-blue-600 text-white shadow-md"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced contacts list */}
        <div className="w-full px-6 py-6">
          {contacts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              {selectedStatus ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Nessun contatto trovato</h3>
                  <p className="text-gray-600 dark:text-gray-400">Non ci sono contatti con i filtri selezionati.</p>
                  <button
                    onClick={() => setSelectedStatus("")}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Cancella filtri
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Nessun contatto disponibile</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    I tuoi contatti appariranno qui quando ne avrai.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: Enhanced card layout */}
              <div className="sm:hidden">
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <motion.div
                      key={contact._id}
                      id={`contact-${contact._id}`}
                      className={`bg-white dark:bg-gray-800 rounded-2xl p-6 transition-all duration-300 cursor-pointer border border-gray-200/50 dark:border-gray-700/50 ${
                        highlightedContactId === contact._id || highlightedContactId === contact.leadId
                          ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 ring-2 ring-orange-300/50 shadow-lg scale-[1.02]"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md hover:scale-[1.01]"
                      }`}
                      onClick={(e) => handleContactClick(contact, e)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start space-x-4">
                        {getSourceIcon(contact)}
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-lg font-semibold truncate transition-colors ${
                              highlightedContactId === contact._id || highlightedContactId === contact.leadId
                                ? "text-orange-800 dark:text-orange-200"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                          </h3>
                          <p
                            className={`text-sm mt-1 transition-colors font-medium ${
                              highlightedContactId === contact._id || highlightedContactId === contact.leadId
                                ? "text-orange-600 dark:text-orange-300"
                                : "text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {contact.email}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{contact.phone}</p>
                          <div className="flex items-center justify-between mt-4">
                            <p className="text-xs text-gray-500 font-medium">{formatDate(contact.createdAt)}</p>
                            <StatusBadge status={contact.status} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Desktop: Enhanced table */}
              <div className="hidden sm:block">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
                  {/* Enhanced table header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-8 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
                    <div className="grid grid-cols-12 gap-6 items-center text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      <div className="col-span-3">Nome</div>
                      <div className="col-span-3">Email</div>
                      <div className="col-span-2">Telefono</div>
                      <div className="col-span-2">Fonte</div>
                      <div className="col-span-1">Data</div>
                      <div className="col-span-1">Stato</div>
                    </div>
                  </div>

                  {/* Enhanced table rows */}
                  <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {contacts.map((contact) => (
                      <motion.div
                        key={contact._id}
                        id={`contact-${contact._id}`}
                        data-lead-id={contact.leadId}
                        className={`px-8 py-6 transition-all duration-300 cursor-pointer ${
                          highlightedContactId === contact._id || highlightedContactId === contact.leadId
                            ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 ring-2 ring-orange-300/50 shadow-md scale-[1.001]"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        }`}
                        onClick={(e) => handleContactClick(contact, e)}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.995 }}
                      >
                        <div className="grid grid-cols-12 gap-6 items-center">
                          {/* Enhanced name with icon */}
                          <div className="col-span-3 flex items-center space-x-4">
                            {getSourceIcon(contact)}
                            <div className="min-w-0 flex-1">
                              <h3
                                className={`font-semibold truncate transition-colors text-base ${
                                  highlightedContactId === contact._id || highlightedContactId === contact.leadId
                                    ? "text-orange-800 dark:text-orange-200"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(" ")}
                              </h3>
                            </div>
                          </div>

                          {/* Enhanced email */}
                          <div className="col-span-3">
                            <p
                              className={`text-sm truncate transition-colors font-medium ${
                                highlightedContactId === contact._id || highlightedContactId === contact.leadId
                                  ? "text-orange-600 dark:text-orange-300"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {contact.email}
                            </p>
                          </div>

                          {/* Enhanced phone */}
                          <div className="col-span-2">
                            <p className="text-sm text-gray-900 dark:text-white truncate font-medium">
                              {contact.phone || "Non disponibile"}
                            </p>
                          </div>

                          {/* Enhanced source */}
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate font-medium">
                              {formatSource(contact.source, contact.formType)}
                            </p>
                          </div>

                          {/* Enhanced date */}
                          <div className="col-span-1">
                            <p className="text-xs text-gray-500 truncate font-medium">
                              {formatDate(contact.createdAt)}
                            </p>
                          </div>

                          {/* Enhanced status */}
                          <div className="col-span-1 flex justify-end">
                            <StatusBadge status={contact.status} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Enhanced pagination */}
          {contacts.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
      </div>

      {/* Enhanced modal with AnimatePresence */}
      <AnimatePresence mode="wait">
        {selectedContact && (
          <ContactDetailModal
            key={selectedContact._id}
            contact={selectedContact}
            onClose={() => {
              setSelectedContact(null)
              setContactTriggerRect(null)
            }}
            triggerRect={contactTriggerRect}
          />
        )}
      </AnimatePresence>
    </div>
  )
}