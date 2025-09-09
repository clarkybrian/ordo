// clearCache.js - Ajoutez ce fichier à la racine du projet
import { deleteDB } from 'idb';

/**
 * Script de nettoyage du cache pour développement
 * Exécutez-le manuellement en appelant window.clearDevCache() dans la console
 */
const clearDevCache = async () => {
  try {
    // Supprime tous les caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('🧹 Tous les caches du navigateur ont été supprimés');
    }

    // Supprime IndexedDB
    await deleteDB('ordo-app-db');
    console.log('🧹 Base de données IndexedDB supprimée');

    // Supprime le Service Worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('🧹 Service Workers supprimés');
    }

    // Supprime localStorage
    localStorage.clear();
    console.log('🧹 localStorage supprimé');

    // Supprime sessionStorage
    sessionStorage.clear();
    console.log('🧹 sessionStorage supprimé');

    console.log('✅ Tout le cache a été nettoyé. Rechargez la page pour appliquer les changements.');
    alert('Cache nettoyé ! La page va maintenant se recharger.');
    
    // Recharge la page avec cache forcé
    window.location.reload(true);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage du cache:', error);
  }
};

// Expose la fonction globalement
window.clearDevCache = clearDevCache;

// Ajoute un bouton de nettoyage du cache en mode développement
if (import.meta.env.DEV) {
  document.addEventListener('DOMContentLoaded', () => {
    const clearCacheButton = document.createElement('button');
    clearCacheButton.textContent = '🧹 Nettoyer le cache';
    clearCacheButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      padding: 10px 15px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    clearCacheButton.onclick = clearDevCache;
    document.body.appendChild(clearCacheButton);
  });
}

// Exécute automatiquement au démarrage si le paramètre URL est présent
if (import.meta.env.DEV && window.location.search.includes('clear-cache')) {
  clearDevCache();
}

export { clearDevCache };
