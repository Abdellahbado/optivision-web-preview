import { LocalStorageData } from './localStorage';
import type { DataStorage } from './types';

export * from './types';

/** Vrai quand l'application tourne dans la fenetre bureau (Tauri). */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

let instance: DataStorage | null = null;

/**
 * Point d'entree unique de la persistance.
 *
 * Toute l'application passe par ici. Brancher SQLite consistera a renvoyer
 * une autre implementation de DataStorage lorsque isDesktop() est vrai,
 * sans toucher aux ecrans.
 */
export function getStorage(): DataStorage {
  if (!instance) {
    instance = new LocalStorageData();
  }
  return instance;
}
