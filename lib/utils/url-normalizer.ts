// lib/utils/url-normalizer.ts

/**
 * Normalizza un URL rimuovendo i parametri di tracking comuni
 * @param url URL da normalizzare
 * @returns URL normalizzato
 */
export function normalizeUrl(url: string): string {
    try {
      // Crea un oggetto URL per manipolare facilmente l'URL
      const urlObj = new URL(url);
      
      // Lista di parametri di tracking da rimuovere
      const trackingParams = [
        'fbclid',     // Facebook click identifier
        'utm_source', // UTM source
        'utm_medium', // UTM medium
        'utm_campaign', // UTM campaign
        'utm_term',   // UTM term
        'utm_content', // UTM content
        'gclid',      // Google click identifier
        'dclid',      // DoubleClick click identifier
        'msclkid',    // Microsoft click identifier
        '_ga',        // Google Analytics
        '_gl',        // Google Analytics
        'ref',        // Generic referrer
        'source',     // Generic source
        'medium',     // Generic medium
      ];
      
      // Rimuovi i parametri di tracking dall'URL
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // Restituisci l'URL normalizzato, rimuovendo la barra finale se presente
      let normalizedUrl = urlObj.toString();
      if (normalizedUrl.endsWith('/') && urlObj.pathname !== '/') {
        normalizedUrl = normalizedUrl.slice(0, -1);
      }
      
      return normalizedUrl;
    } catch (error) {
      // In caso di errore (URL non valido), restituisci l'URL originale
      console.error('Errore durante la normalizzazione dell\'URL:', error);
      return url;
    }
  }
  
  /**
   * Raggruppa le landing page per URL normalizzato
   * @param landingPages Array di landing page
   * @returns Array di landing page raggruppate
   */
  export function groupLandingPagesByNormalizedUrl<T extends { url: string; id: string }>(
    landingPages: T[]
  ): T[] {
    // Mappa per tenere traccia delle pagine raggruppate
    const groupedPages: Map<string, T> = new Map();
    
    // Raggruppa le pagine per URL normalizzato
    landingPages.forEach(page => {
      const normalizedUrl = normalizeUrl(page.url);
      
      if (groupedPages.has(normalizedUrl)) {
        // Se la pagina esiste già, aggiorna i dati se necessario
        // Questo dipenderà dalla struttura specifica dei tuoi dati
      } else {
        // Altrimenti, aggiungi la pagina alla mappa
        groupedPages.set(normalizedUrl, {...page, url: normalizedUrl});
      }
    });
    
    // Converti la mappa in un array e restituiscilo
    return Array.from(groupedPages.values());
  }