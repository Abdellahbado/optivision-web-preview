import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockClients, mockCommandes, mockFactures, mockOrdonnances, mockProduits } from '@/lib/mockData';
import type {
  Client,
  ClientInput,
  Commande,
  CommandeInput,
  Facture,
  FactureInput,
  Ordonnance,
  OrdonnanceInput,
  Produit,
  ProduitInput,
} from '@/types';

interface AppDataStore {
  clients: Client[];
  ordonnances: Ordonnance[];
  produits: Produit[];
  commandes: Commande[];
  factures: Facture[];
  createClient: (data: ClientInput) => Client;
  updateClient: (id: number, data: Partial<ClientInput>) => void;
  deleteClient: (id: number) => void;
  createOrdonnance: (data: OrdonnanceInput) => Ordonnance;
  updateOrdonnance: (id: number, data: Partial<OrdonnanceInput>) => void;
  deleteOrdonnance: (id: number) => void;
  createProduit: (data: ProduitInput) => Produit;
  updateProduit: (id: number, data: Partial<ProduitInput>) => void;
  deleteProduit: (id: number) => void;
  updateProduitStock: (id: number, delta: number) => void;
  createCommande: (data: CommandeInput) => Commande;
  updateCommande: (id: number, data: Partial<Commande>) => void;
  createFacture: (data: FactureInput) => Facture;
  updateFacture: (id: number, data: Partial<Facture>) => void;
  replaceAllData: (data: Partial<Pick<AppDataStore, 'clients' | 'ordonnances' | 'produits' | 'commandes' | 'factures'>>) => void;
  resetAllData: () => void;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getDefaultData() {
  return {
    clients: clone(mockClients),
    ordonnances: clone(mockOrdonnances),
    produits: clone(mockProduits),
    commandes: clone(mockCommandes),
    factures: clone(mockFactures),
  };
}

function nextId<T extends { id: number }>(items: T[]): number {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

export const useAppDataStore = create<AppDataStore>()(
  persist(
    (set, get) => ({
      ...getDefaultData(),

      createClient: (data) => {
        const state = get();
        const id = nextId(state.clients);
        const now = new Date().toISOString();
        const created: Client = {
          id,
          code: `CLI-${String(id).padStart(4, '0')}`,
          ...data,
          created_at: now,
          updated_at: now,
        };
        set({ clients: [created, ...state.clients] });
        return created;
      },

      updateClient: (id, data) => {
        set((state) => ({
          clients: state.clients.map((client) =>
            client.id === id ? { ...client, ...data, updated_at: new Date().toISOString() } : client
          ),
        }));
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((client) => client.id !== id),
        }));
      },

      createOrdonnance: (data) => {
        const state = get();
        const id = nextId(state.ordonnances);
        const now = new Date().toISOString();
        const year = new Date().getFullYear();
        const nextNum =
          state.ordonnances.filter((o) => o.numero.startsWith(`ORD-${year}`)).length + 1;
        const created: Ordonnance = {
          id,
          numero: `ORD-${year}-${String(nextNum).padStart(4, '0')}`,
          ...data,
          created_at: now,
        };
        set({ ordonnances: [created, ...state.ordonnances] });
        return created;
      },

      updateOrdonnance: (id, data) => {
        set((state) => ({
          ordonnances: state.ordonnances.map((ord) =>
            ord.id === id ? { ...ord, ...data } : ord
          ),
        }));
      },

      deleteOrdonnance: (id) => {
        set((state) => ({
          ordonnances: state.ordonnances.filter((ord) => ord.id !== id),
        }));
      },

      createProduit: (data) => {
        const state = get();
        const id = nextId(state.produits);
        const now = new Date().toISOString();
        const created: Produit = {
          id,
          ...data,
          actif: data.actif ?? true,
          created_at: now,
          updated_at: now,
        };
        set({ produits: [created, ...state.produits] });
        return created;
      },

      updateProduit: (id, data) => {
        set((state) => ({
          produits: state.produits.map((produit) =>
            produit.id === id ? { ...produit, ...data, updated_at: new Date().toISOString() } : produit
          ),
        }));
      },

      deleteProduit: (id) => {
        set((state) => ({
          produits: state.produits.filter((produit) => produit.id !== id),
        }));
      },

      updateProduitStock: (id, delta) => {
        set((state) => ({
          produits: state.produits.map((produit) =>
            produit.id === id
              ? {
                  ...produit,
                  quantite: Math.max(0, produit.quantite + delta),
                  updated_at: new Date().toISOString(),
                }
              : produit
          ),
        }));
      },

      createCommande: (data) => {
        const state = get();
        const id = nextId(state.commandes);
        const now = new Date().toISOString();
        const year = new Date().getFullYear();
        const nextNum =
          state.commandes.filter((c) => c.numero.startsWith(`CMD-${year}`)).length + 1;
        const created: Commande = {
          id,
          numero: `CMD-${year}-${String(nextNum).padStart(4, '0')}`,
          ...data,
          created_at: now,
          updated_at: now,
        };
        set({ commandes: [created, ...state.commandes] });
        return created;
      },

      updateCommande: (id, data) => {
        set((state) => ({
          commandes: state.commandes.map((commande) =>
            commande.id === id ? { ...commande, ...data, updated_at: new Date().toISOString() } : commande
          ),
        }));
      },

      createFacture: (data) => {
        const state = get();
        const id = nextId(state.factures);
        const now = new Date().toISOString();
        const year = new Date().getFullYear();
        const nextNum =
          state.factures.filter((f) => f.numero.startsWith(`FAC-${year}`)).length + 1;
        const created: Facture = {
          id,
          numero: `FAC-${year}-${String(nextNum).padStart(4, '0')}`,
          ...data,
          created_at: now,
          updated_at: now,
        };
        set({ factures: [created, ...state.factures] });
        return created;
      },

      updateFacture: (id, data) => {
        set((state) => ({
          factures: state.factures.map((facture) =>
            facture.id === id ? { ...facture, ...data, updated_at: new Date().toISOString() } : facture
          ),
        }));
      },

      replaceAllData: (data) => {
        set((state) => ({
          clients: data.clients ?? state.clients,
          ordonnances: data.ordonnances ?? state.ordonnances,
          produits: data.produits ?? state.produits,
          commandes: data.commandes ?? state.commandes,
          factures: data.factures ?? state.factures,
        }));
      },

      resetAllData: () => {
        set(getDefaultData());
      },
    }),
    {
      name: 'optivision-app-data',
      partialize: (state) => ({
        clients: state.clients,
        ordonnances: state.ordonnances,
        produits: state.produits,
        commandes: state.commandes,
        factures: state.factures,
      }),
    }
  )
);
