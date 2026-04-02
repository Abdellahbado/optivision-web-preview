export * from './client';
export * from './ordonnance';
export * from './produit';
export * from './commande';
export * from './facture';
export * from './listeVerres';

// Dashboard stats type
export interface DashboardStats {
  clients_total: number;
  clients_nouveaux_mois: number;
  commandes_en_cours: number;
  commandes_pret: number;
  ca_mois: number;
  ca_mois_precedent: number;
  factures_impayees: number;
  montant_impaye: number;
  produits_stock_bas: number;
}
