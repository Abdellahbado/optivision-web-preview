export type CategorieType = 'MON' | 'VER' | 'LEN' | 'ACC' | 'SRV';

// Monture-specific fields
export interface MontureFields {
  materiau?: 'metal' | 'acetate' | 'titane' | 'plastique' | 'mixte' | 'bois';
  forme?: 'rectangulaire' | 'ronde' | 'ovale' | 'carree' | 'papillon' | 'aviateur' | 'cat-eye';
  genre?: 'homme' | 'femme' | 'unisexe' | 'enfant';
  largeur_pont?: number;      // Bridge width in mm
  largeur_verre?: number;     // Lens width in mm
  longueur_branche?: number;  // Temple length in mm
}

// Verre-specific fields
export interface VerreFields {
  type_verre?: 'unifocal' | 'bifocal' | 'progressif' | 'degressif' | 'mi-distance';
  indice?: 1.5 | 1.56 | 1.6 | 1.67 | 1.74;
  matiere_verre?: 'organique' | 'mineral' | 'polycarbonate' | 'trivex';
  traitements?: string[];     // AR, anti-rayure, photochromique, bluefilter
  diametre?: number;          // Lens diameter in mm
  sphere_min?: number;
  sphere_max?: number;
  cylindre_max?: number;
}

// Lentille-specific fields
export interface LentilleFields {
  type_lentille?: 'journaliere' | 'bimensuelle' | 'mensuelle' | 'annuelle' | 'rigide';
  rayon_courbure?: number;    // Base curve (BC)
  diametre_lentille?: number; // Diameter in mm
  teneur_eau?: number;        // Water content %
  sphere_min?: number;
  sphere_max?: number;
  cylindre_disponible?: boolean;
  multifocale?: boolean;
  couleur_disponible?: boolean;
}

// Accessoire-specific fields
export interface AccessoireFields {
  type_accessoire?: 'etui' | 'chiffon' | 'spray' | 'cordon' | 'autre';
}

// Service-specific fields
export interface ServiceFields {
  duree_minutes?: number;
  type_service?: 'examen' | 'ajustement' | 'reparation' | 'nettoyage' | 'autre';
}

export interface Produit {
  id: number;
  reference: string;
  nom: string;
  categorie: CategorieType;
  marque?: string;
  modele?: string;
  couleur?: string;
  taille?: string;
  matiere?: string;
  prix_achat?: number;
  prix_vente: number;
  quantite: number;
  stock_minimum: number;
  fournisseur_id?: number;
  emplacement?: string;
  notes?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
  
  // Category-specific fields
  monture?: MontureFields;
  verre?: VerreFields;
  lentille?: LentilleFields;
  accessoire?: AccessoireFields;
  service?: ServiceFields;
}

export interface ProduitWithFournisseur extends Produit {
  fournisseur_nom?: string;
}

export type ProduitInput = Omit<Produit, 'id' | 'created_at' | 'updated_at' | 'actif'> & { actif?: boolean };

// Options for select dropdowns
export const MONTURE_MATERIAUX = [
  { value: 'metal', label: 'Métal' },
  { value: 'acetate', label: 'Acétate' },
  { value: 'titane', label: 'Titane' },
  { value: 'plastique', label: 'Plastique' },
  { value: 'mixte', label: 'Mixte' },
  { value: 'bois', label: 'Bois' },
] as const;

export const MONTURE_FORMES = [
  { value: 'rectangulaire', label: 'Rectangulaire' },
  { value: 'ronde', label: 'Ronde' },
  { value: 'ovale', label: 'Ovale' },
  { value: 'carree', label: 'Carrée' },
  { value: 'papillon', label: 'Papillon' },
  { value: 'aviateur', label: 'Aviateur' },
  { value: 'cat-eye', label: 'Cat-eye' },
] as const;

export const MONTURE_GENRES = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'unisexe', label: 'Unisexe' },
  { value: 'enfant', label: 'Enfant' },
] as const;

export const VERRE_TYPES = [
  { value: 'unifocal', label: 'Unifocal' },
  { value: 'bifocal', label: 'Bifocal' },
  { value: 'progressif', label: 'Progressif' },
  { value: 'degressif', label: 'Dégressif' },
  { value: 'mi-distance', label: 'Mi-distance' },
] as const;

export const VERRE_INDICES = [
  { value: 1.5, label: '1.50 (Standard)' },
  { value: 1.56, label: '1.56 (Affiné)' },
  { value: 1.6, label: '1.60 (Fin)' },
  { value: 1.67, label: '1.67 (Très fin)' },
  { value: 1.74, label: '1.74 (Ultra fin)' },
] as const;

export const VERRE_MATIERES = [
  { value: 'organique', label: 'Organique' },
  { value: 'mineral', label: 'Minéral' },
  { value: 'polycarbonate', label: 'Polycarbonate' },
  { value: 'trivex', label: 'Trivex' },
] as const;

export const VERRE_TRAITEMENTS = [
  { value: 'antireflet', label: 'Anti-reflet' },
  { value: 'antirayure', label: 'Anti-rayure' },
  { value: 'photochromique', label: 'Photochromique' },
  { value: 'bluefilter', label: 'Filtre lumière bleue' },
  { value: 'hydrophobe', label: 'Hydrophobe' },
  { value: 'oleophobe', label: 'Oléophobe' },
] as const;

export const LENTILLE_TYPES = [
  { value: 'journaliere', label: 'Journalière' },
  { value: 'bimensuelle', label: 'Bimensuelle' },
  { value: 'mensuelle', label: 'Mensuelle' },
  { value: 'annuelle', label: 'Annuelle' },
  { value: 'rigide', label: 'Rigide' },
] as const;

export const ACCESSOIRE_TYPES = [
  { value: 'etui', label: 'Étui' },
  { value: 'chiffon', label: 'Chiffon' },
  { value: 'spray', label: 'Spray nettoyant' },
  { value: 'cordon', label: 'Cordon' },
  { value: 'autre', label: 'Autre' },
] as const;

export const SERVICE_TYPES = [
  { value: 'examen', label: 'Examen de vue' },
  { value: 'ajustement', label: 'Ajustement' },
  { value: 'reparation', label: 'Réparation' },
  { value: 'nettoyage', label: 'Nettoyage professionnel' },
  { value: 'autre', label: 'Autre' },
] as const;

export type MouvementType = 'ENTREE' | 'SORTIE' | 'VENTE' | 'CASSE' | 'AJUSTEMENT' | 'ANNULATION';

export type CasseRaison = 'MANIPULATION' | 'DEFAUT' | 'CLIENT' | 'AUTRE';

export interface MouvementStock {
  id: number;
  produit_id: number;
  type: MouvementType;
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  raison?: string;
  commande_id?: number;  // Link to order for VENTE type
  prix_achat?: number;   // Purchase price at time of movement (for loss tracking)
  date: string;
}

export interface MouvementStockInput {
  produit_id: number;
  type: MouvementType;
  quantite: number;
  raison?: string;
  commande_id?: number;
}

// Casse (breakage) record for detailed loss tracking
export interface Casse {
  id: number;
  produit_id: number;
  mouvement_id: number;  // Link to stock movement
  quantite: number;
  prix_achat_unitaire: number;
  montant_perte: number;  // Total loss = quantite × prix_achat_unitaire
  raison: CasseRaison;
  notes?: string;
  date: string;
}

export interface CasseInput {
  produit_id: number;
  quantite: number;
  raison: CasseRaison;
  notes?: string;
}

export const CASSE_RAISONS = [
  { value: 'MANIPULATION', label: 'Casse manipulation' },
  { value: 'DEFAUT', label: 'Produit défectueux' },
  { value: 'CLIENT', label: 'Casse client' },
  { value: 'AUTRE', label: 'Autre' },
] as const;

export interface Fournisseur {
  id: number;
  nom: string;
  contact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  notes?: string;
  date_creation: string;
}

export type FournisseurInput = Omit<Fournisseur, 'id' | 'date_creation'>;
