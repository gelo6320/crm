/**
 * Cookie Consent Manager per costruzionedigitale.com
 * Gestisce la UI e le interazioni per il consenso ai cookie
 */

(function() {
    // Stato del consenso
    let consentState = {
      essential: true, // I cookie essenziali sono sempre necessari
      analytics: false,
      marketing: false,
      configured: false
    };
    
    // Inizializza lo stato dai cookie esistenti
    function initConsentState() {
      try {
        const storedConsent = getCookie('user_cookie_consent');
        if (storedConsent) {
          const parsed = JSON.parse(storedConsent);
          consentState = {
            essential: parsed.essential !== undefined ? parsed.essential : true,
            analytics: parsed.analytics !== undefined ? parsed.analytics : false,
            marketing: parsed.marketing !== undefined ? parsed.marketing : false,
            configured: parsed.configured !== undefined ? parsed.configured : false
          };
        }
      } catch (error) {
        console.error('Errore durante l\'inizializzazione del consenso:', error);
      }
      
      // Se il consenso non è ancora configurato, mostra il banner
      if (!consentState.configured) {
        setTimeout(showConsentBanner, 1000);
      }
    }
    
    // Funzione per ottenere un cookie
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }
    
    // Funzione per impostare un cookie
    function setCookie(name, value, days) {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = `; expires=${date.toUTCString()}`;
      }
      document.cookie = `${name}=${value}${expires}; path=/; SameSite=Strict`;
    }
    
    // Salva le preferenze di consenso
    async function saveConsent(preferences) {
      try {
        // Aggiorna lo stato locale
        consentState = {
          ...consentState,
          ...preferences,
          configured: true
        };
        
        // Salva nel cookie
        setCookie('user_cookie_consent', JSON.stringify(consentState), 365);
        
        // Invia al server
        const response = await fetch('/api/cookie-consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(consentState)
        });
        
        if (!response.ok) {
          console.error('Errore nel salvataggio delle preferenze cookie:', await response.json());
        }
        
        // Ricarica la pagina per applicare le preferenze
        window.location.reload();
      } catch (error) {
        console.error('Errore nel salvataggio del consenso:', error);
      }
    }
    
    // Mostra il banner del consenso
    function showConsentBanner() {
      // Controlla se il banner esiste già
      if (document.getElementById('cookie-consent-banner')) {
        return;
      }
      
      // Crea il banner
      const banner = document.createElement('div');
      banner.id = 'cookie-consent-banner';
      banner.innerHTML = `
        <div class="cookie-consent-content">
          <div class="cookie-header">
            <h3>Impostazioni Cookie</h3>
            <button id="cookie-close">×</button>
          </div>
          <p>
            Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito. I cookie essenziali sono necessari per il funzionamento del sito. 
            Puoi scegliere quali cookie accettare.
          </p>
          <div class="cookie-options">
            <div class="cookie-option">
              <label>
                <input type="checkbox" id="essential-cookies" checked disabled>
                <span>Cookie Essenziali</span>
              </label>
              <p class="option-description">Necessari per il funzionamento del sito</p>
            </div>
            <div class="cookie-option">
              <label>
                <input type="checkbox" id="analytics-cookies" ${consentState.analytics ? 'checked' : ''}>
                <span>Cookie Analitici</span>
              </label>
              <p class="option-description">Ci aiutano a capire come utilizzi il sito</p>
            </div>
            <div class="cookie-option">
              <label>
                <input type="checkbox" id="marketing-cookies" ${consentState.marketing ? 'checked' : ''}>
                <span>Cookie Marketing</span>
              </label>
              <p class="option-description">Utilizzati per mostrarti annunci pertinenti</p>
            </div>
          </div>
          <div class="cookie-actions">
            <button id="reject-all">Rifiuta Tutti</button>
            <button id="accept-selected">Salva Preferenze</button>
            <button id="accept-all">Accetta Tutti</button>
          </div>
        </div>
      `;
      
      // Stili per il banner
      const style = document.createElement('style');
      style.textContent = `
        #cookie-consent-banner {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          max-width: 500px;
          width: 95%;
          background-color: #212121;
          color: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          z-index: 10000;
          font-family: 'Montserrat', Arial, sans-serif;
        }
        
        .cookie-consent-content {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .cookie-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .cookie-header h3 {
          margin: 0;
          color: #FF6B00;
        }
        
        #cookie-close {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        }
        
        .cookie-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .cookie-option {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .cookie-option label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .option-description {
          margin: 0;
          font-size: 12px;
          opacity: 0.8;
          margin-left: 24px;
        }
        
        .cookie-actions {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 10px;
        }
        
        .cookie-actions button {
          padding: 8px 15px;
          border-radius: 5px;
          border: none;
          cursor: pointer;
          font-weight: bold;
          font-family: 'Montserrat', Arial, sans-serif;
        }
        
        #reject-all {
          background-color: #333;
          color: white;
          flex: 1;
        }
        
        #accept-selected {
          background-color: #444;
          color: white;
          flex: 1;
        }
        
        #accept-all {
          background-color: #FF6B00;
          color: white;
          flex: 1;
        }
      `;
      
      // Aggiungi al DOM
      document.head.appendChild(style);
      document.body.appendChild(banner);
      
      // Aggiungi event listener
      document.getElementById('cookie-close').addEventListener('click', () => {
        banner.style.display = 'none';
      });
      
      document.getElementById('reject-all').addEventListener('click', () => {
        saveConsent({
          essential: true,
          analytics: false,
          marketing: false
        });
      });
      
      document.getElementById('accept-selected').addEventListener('click', () => {
        const analytics = document.getElementById('analytics-cookies').checked;
        const marketing = document.getElementById('marketing-cookies').checked;
        
        saveConsent({
          essential: true,
          analytics,
          marketing
        });
      });
      
      document.getElementById('accept-all').addEventListener('click', () => {
        saveConsent({
          essential: true,
          analytics: true,
          marketing: true
        });
      });
    }
    
    // Aggiungi un pulsante per aprire il pannello delle impostazioni
    function addSettingsButton() {
      const button = document.createElement('button');
      button.id = 'cookie-settings-button';
      button.textContent = 'Impostazioni Cookie';
      button.addEventListener('click', showConsentBanner);
      
      const style = document.createElement('style');
      style.textContent = `
        #cookie-settings-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #FF6B00;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 8px 12px;
          font-size: 12px;
          cursor: pointer;
          z-index: 9999;
          font-family: 'Montserrat', Arial, sans-serif;
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(button);
    }
    
    // Inizializza
    initConsentState();
    
    // Aggiungi il pulsante delle impostazioni dopo 2 secondi
    setTimeout(addSettingsButton, 2000);
    
    // Esponi l'API globalmente
    window.cookieConsent = {
      show: showConsentBanner,
      getState: () => ({ ...consentState }),
      saveConsent
    };
  })();