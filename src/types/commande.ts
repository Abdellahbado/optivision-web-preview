export type CommandeStatut = 'NEW' | 'ORD' | 'RCV' | 'ASM' | 'RDY' | 'DLV' | 'CAN';

export interface Commande {
  id: number;
  numero: string;
  client_id: number;
  ordonnance_id?: number;
  /** Lignes de la vente: monture, verre OD, verre OG, accessoires, services. */
  lignes?: CommandeLigne[];
  /** @deprecated conserve pour les commandes creees avant le passage aux lignes. */
  monture_id?: number;
  /** @deprecated conserve pour les commandes creees avant le passage aux lignes. */
  verre_id?: number;
  date_commande: string;
  date_livraison_prevue?: string;
  date_livraison?: string;
  statut: CommandeStatut;
  total_ht: number;
  remise_pourcentage?: number;
  remise_montant?: number;
  total_ttc: number;
  notes?: string;
  notes_atelier?: string;
  created_at: string;
  updated_at: string;
}

export interface CommandeWithClient extends Commande {
  client_nom: string;
  client_prenom: string;
  client_telephone: string;
}

export type CommandeInput = Omit<Commande, 'id' | 'numero' | 'created_at' | 'updated_at'>;

export type LigneType =
  | 'MONTURE'
  | 'VERRE_OD'
  | 'VERRE_OG'
  | 'LENTILLE'
  | 'ACCESSOIRE'
  | 'SERVICE';

export const LIGNE_LABELS: Record<LigneType, string> = {
  MONTURE: 'Monture',
  VERRE_OD: 'Verre œil droit',
  VERRE_OG: 'Verre œil gauche',
  LENTILLE: 'Lentilles',
  ACCESSOIRE: 'Accessoire',
  SERVICE: 'Service',
};

export interface CommandeLigne {
  id: number;
  commande_id: number;
  produit_id?: number;
  description: string;
  type: LigneType;
  /** Vrai quand le produit n'etait pas en stock: la ligne part chez le fournisseur. */
  a_commander?: boolean;
  quantite: number;
  prix_unitaire: number;        // Sale price per unit
  prix_achat_unitaire?: number; // Purchase price per unit (for profit tracking)
  remise: number;
  prix_total: number;           // Total sale price
  cout_total?: number;          // Total cost (qty × purchase price)
}

export type CommandeLigneInput = Omit<CommandeLigne, 'id'>;

export interface CommandeWithTotals extends Commande {
  total_cout?: number;       // Total cost of goods
  benefice_brut?: number;    // Gross profit (total_ttc - total_cout)
  marge_pourcentage?: number; // Margin percentage
}

export interface CommandeVerre {
  id: number;
  commande_id: number;
  oeil: 'OD' | 'OG';
  type_verre?: string;
  indice?: number;
  traitements?: string;
  sphere?: number;
  cylindre?: number;
  axe?: number;
  addition?: number;
}

export type CommandeVerreInput = Omit<CommandeVerre, 'id'>;
