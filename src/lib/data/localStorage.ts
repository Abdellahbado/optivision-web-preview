import { PARAMETRES_DEFAUT } from './types';
import type { CollectionName, DataSnapshot, DataStorage, Mutation } from './types';

const STORAGE_KEY = 'optivision-data-v2';

const COLLECTIONS: CollectionName[] = [
  'clients',
  'ordonnances',
  'produits',
  'commandes',
  'factures',
  'paiements',
  'mouvements',
  'listesVerres',
  'listeItems',
];

/**
 * Persistance navigateur (mode demonstration et apercu web).
 * La version bureau utilisera la meme interface avec SQLite.
 */
export class LocalStorageData implements DataStorage {
  private cache: DataSnapshot | null = null;

  async load(): Promise<DataSnapshot | null> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as DataSnapshot;
      if (!parsed || !Array.isArray(parsed.clients) || !parsed.compteurs) return null;
      // Une collection ajoutee apres coup ne doit pas casser une base existante.
      for (const name of COLLECTIONS) {
        if (!Array.isArray(parsed[name])) {
          (parsed[name] as unknown[]) = [];
        }
      }
      parsed.parametres = { ...PARAMETRES_DEFAUT, ...(parsed.parametres ?? {}) };
      this.cache = parsed;
      return parsed;
    } catch {
      return null;
    }
  }

  async commit(mutations: Mutation[]): Promise<void> {
    for (const mutation of mutations) {
      if (mutation.type === 'replaceAll') {
        this.cache = mutation.snapshot;
        continue;
      }
      if (!this.cache) continue;

      if (mutation.type === 'compteurs') {
        this.cache.compteurs = mutation.compteurs;
        continue;
      }

      if (mutation.type === 'parametres') {
        this.cache.parametres = mutation.parametres;
        continue;
      }

      const rows = this.cache[mutation.collection] as { id: number }[];
      if (mutation.type === 'upsert') {
        const index = rows.findIndex((row) => row.id === mutation.row.id);
        if (index >= 0) rows[index] = mutation.row;
        else rows.unshift(mutation.row);
        continue;
      }
      this.cache[mutation.collection] = rows.filter(
        (row) => row.id !== mutation.id
      ) as never;
    }

    if (this.cache) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    }
  }
}
