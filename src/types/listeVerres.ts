export type ListeVerresStatut = 'BROUILLON' | 'ENVOYEE' | 'RECUE';

export interface ListeVerres {
  id: number;
  date: string;
  statut: ListeVerresStatut;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed
  items_count?: number;
  items_en_stock?: number;
}

export interface ListeVerreItem {
  id: number;
  liste_id: number;
  commande_id?: number;
  commande_verre_id?: number;
  client_nom?: string;
  oeil: 'OD' | 'OG';
  type_verre?: string;
  indice?: number;
  sphere?: number;
  cylindre?: number;
  axe?: number;
  addition?: number;
  traitements?: string;
  en_stock: boolean;
  notes?: string;
}

export type ListeVerreItemInput = Omit<ListeVerreItem, 'id'>;

export interface ListeVerresWithItems extends ListeVerres {
  items: ListeVerreItem[];
}

// For display, group similar lenses
export interface GroupedLensItem {
  type_verre?: string;
  indice?: number;
  sphere?: number;
  cylindre?: number;
  axe?: number;
  addition?: number;
  traitements?: string;
  count: number;
  items: ListeVerreItem[];
  allInStock: boolean;
}

export const LISTE_STATUTS = [
  { value: 'BROUILLON', label: 'Brouillon', color: 'gray' },
  { value: 'ENVOYEE', label: 'Envoyée', color: 'blue' },
  { value: 'RECUE', label: 'Reçue', color: 'green' },
] as const;
