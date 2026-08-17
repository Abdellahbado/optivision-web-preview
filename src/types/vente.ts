import type { Commande, LigneType } from './commande';
import type { Facture, PaymentMethod } from './facture';

/** Une ligne saisie au comptoir, avant enregistrement. */
export interface VenteLigne {
  /** Identifiant local de la ligne dans le formulaire (pas en base). */
  cle: string;
  type: LigneType;
  produit_id?: number;
  description: string;
  quantite: number;
  prix_unitaire: number;
  prix_achat_unitaire?: number;
  /** Le produit n'est pas en stock: la ligne ira sur le bon de commande. */
  a_commander: boolean;
}

export interface VenteInput {
  client_id: number;
  ordonnance_id?: number;
  lignes: VenteLigne[];
  remise_montant: number;
  /** Prix final impose a la main (arrangement, forfait). Prioritaire sur la remise. */
  total_force?: number;
  acompte: number;
  mode_paiement?: PaymentMethod;
  date_livraison_prevue?: string;
  notes_atelier?: string;
}

export interface VenteResultat {
  commande: Commande;
  facture: Facture;
}
