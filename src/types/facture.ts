export type FactureStatut = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethod = 'ESP' | 'CB' | 'CHQ' | 'VIR' | 'AUT';

export interface Facture {
  id: number;
  numero: string;
  commande_id?: number;
  client_id: number;
  date_facture: string;
  date_echeance?: string;
  total_ht: number;
  tva?: number;
  remise_montant?: number;
  total_ttc: number;
  montant_paye: number;
  mode_paiement?: PaymentMethod;
  notes?: string;
  statut: FactureStatut;
  created_at: string;
  updated_at: string;
}

export interface FactureWithClient extends Facture {
  client_nom: string;
  client_prenom: string;
}

export type FactureInput = Omit<Facture, 'id' | 'numero' | 'created_at' | 'updated_at'>;

export interface FactureLigne {
  id: number;
  facture_id: number;
  description: string;
  quantite: number;
  prix_unitaire: number;
  remise: number;
  prix_total: number;
}

export type FactureLigneInput = Omit<FactureLigne, 'id'>;

export interface Paiement {
  id: number;
  facture_id: number;
  date: string;
  montant: number;
  mode: PaymentMethod;
  reference?: string;
  notes?: string;
}

export type PaiementInput = Omit<Paiement, 'id'>;
