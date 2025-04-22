/**
 * Script di tracciamento personalizzato per costruzionedigitale.com
 * Gestisce i consensi per cookie essenziali, analytics, e marketing
 */

(function() {
    // Funzione per ottenere il consenso corrente dai cookie
    function getConsentFromCookie() {
      try {
        const cookieConsent = getCookie('user_cookie_consent');
        if (cookieConsent) {
          return JSON.parse(cookieConsent);
        }
      } catch (error) {
        console.error('Errore nel parsing del cookie di consenso:', error);
      }
      
      // Valori predefiniti se non esiste un cookie
      return { 
        essential: true, 
        analytics: false, 
        marketing: false,
        configured: false
      };
    }
    
    // Funzione per ottenere il valore di un cookie
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }
    
    // Ottieni il consenso corrente
    const consent = getConsentFromCookie();
    
    // Esponi il consenso globalmente
    window.userConsent = consent;
    console.log("Consenso utente:", consent);
    
    // Google Analytics - solo se il consenso analytics è true
    if (consent.analytics) {
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-MBFTYV86P7');
      
      // Carica lo script GA
      var gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-MBFTYV86P7';
      document.head.appendChild(gaScript);
      
      console.log('Google Analytics attivato basato sul consenso utente');
    }
    
    // Meta Pixel - solo se il consenso marketing è true
    if (consent.marketing) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      
      // Inizializza pixel e invia PageView
      window.fbEventId = 'event_' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 15);
      fbq('init', '1543790469631614');
      fbq('track', 'PageView', {}, {eventID: window.fbEventId});
      
      console.log('Meta Pixel attivato basato sul consenso utente, eventID:', window.fbEventId);
    }
  })();