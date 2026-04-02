export interface Ordonnance {
  id: number;
  numero: string;
  client_id: number;
  date_prescription: string;
  medecin?: string;
  od_sphere?: number;
  od_cylindre?: number;
  od_axe?: number;
  od_addition?: number;
  og_sphere?: number;
  og_cylindre?: number;
  og_axe?: number;
  og_addition?: number;
  ecart_pupillaire?: number;
  ecart_vl?: number;
  ecart_vp?: number;
  type_vision?: 'VL' | 'VP' | 'VL+VP';
  notes?: string;
  created_at: string;
}

export interface OrdonnanceWithClient extends Ordonnance {
  client_nom: string;
  client_prenom: string;
}

export type OrdonnanceInput = Omit<Ordonnance, 'id' | 'numero' | 'created_at'>;
