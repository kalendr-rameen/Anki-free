import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with immediate precache for 100% offline capability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, updating cache...');
  },
  onOfflineReady() {
    console.log('App ready to work 100% offline!');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
