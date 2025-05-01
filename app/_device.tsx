// app/_device.tsx
"use client";

import { useEffect } from "react";

export default function DeviceDetectionInitializer() {
  useEffect(() => {
    // Detect touch devices
    const isTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };
    
    // Detect iOS devices
    const isIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };
    
    // Add specific classes to the HTML element for conditional styling
    const html = document.documentElement;
    
    if (isTouchDevice()) {
      html.classList.add('has-touch');
      
      // Special handling for iOS to prevent bounce effect
      if (isIOS()) {
        html.classList.add('is-ios');
        
        // Fix for 100vh issue on iOS
        const appHeight = () => {
          const doc = document.documentElement;
          doc.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        };
        
        window.addEventListener('resize', appHeight);
        window.addEventListener('orientationchange', appHeight);
        appHeight();
      }
    } else {
      html.classList.add('has-mouse');
    }
    
    // Detect mobile devices by screen size
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        html.classList.add('is-mobile');
        html.classList.remove('is-desktop');
      } else {
        html.classList.remove('is-mobile');
        html.classList.add('is-desktop');
      }
    };
    
    // Check on load and on resize
    window.addEventListener('resize', checkMobile);
    checkMobile();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (isIOS()) {
        window.removeEventListener('resize', appHeight);
        window.removeEventListener('orientationchange', appHeight);
      }
    };
    
    function appHeight() {
      const doc = document.documentElement;
      doc.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }
  }, []);
  
  // This component doesn't render anything
  return null;
}