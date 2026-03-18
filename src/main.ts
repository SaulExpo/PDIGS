import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

function loadGoogleMapsApi(): Promise<void> {
  const apiKey = (window as any).__env?.googleMapsApiKey;
  if (!apiKey) {
    console.warn('No Google Maps API key provided (window.__env.googleMapsApiKey). Map may not work.');
    return Promise.resolve();
  }

  const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (existing) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });
}

loadGoogleMapsApi()
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch((err) => console.error(err));