import type {
  Client,
  Commande,
  Facture,
  ListeVerreItem,
  ListeVerres,
  MouvementStock,
  Ordonnance,
  Paiement,
  Produit,
} from '@/types';

/**
 * Compteurs de numerotation.
 *
 * Les numeros ne sont jamais recalcules a partir du nombre de lignes existantes:
 * un compteur monotone garantit qu'une suppression ne fait pas reutiliser un
 * numero de facture ou de commande deja emis.
 */
export interface Compteurs {
  client: number;
  ordonnance: number;
  produit: number;
  commande: number;
  facture: number;
  paiement: number;
  mouvement: number;
  ligne: number;
  liste: number;
  listeItem: number;
  annee: number;
}

/** Identite du magasin: en-tete des factures, des fiches d'atelier et des bons. */
export interface Parametres {
  nom_magasin: string;
  specialite: string;
  adresse: string;
  telephone: string;
  email: string;
  nif: string;
  numero_article: string;
  devise: string;
  tva: number;
}

export const PARAMETRES_DEFAUT: Parametres = {
  nom_magasin: 'OPTIQUE KHADIDJA',
  specialite: 'Opticien Diplômé Sup. Optique',
  adresse: '',
  telephone: '',
  email: '',
  nif: '29731607128727',
  numero_article: '42120041947',
  devise: 'DZD',
  tva: 0,
};

export interface DataSnapshot {
  clients: Client[];
  ordonnances: Ordonnance[];
  produits: Produit[];
  commandes: Commande[];
  factures: Facture[];
  paiements: Paiement[];
  mouvements: MouvementStock[];
  listesVerres: ListeVerres[];
  listeItems: ListeVerreItem[];
  compteurs: Compteurs;
  parametres: Parametres;
}

export type CollectionName = Exclude<keyof DataSnapshot, 'compteurs' | 'parametres'>;

/**
 * Une modification atomique du magasin de donnees.
 * Le store applique la mutation en memoire, la couche de persistance
 * l'applique sur le support (localStorage aujourd'hui, SQLite ensuite).
 */
export type Mutation =
  | { type: 'upsert'; collection: CollectionName; row: { id: number } }
  | { type: 'delete'; collection: CollectionName; id: number }
  | { type: 'compteurs'; compteurs: Compteurs }
  | { type: 'parametres'; parametres: Parametres }
  | { type: 'replaceAll'; snapshot: DataSnapshot };

export interface DataStorage {
  /** Retourne null au tout premier demarrage (base vide). */
  load(): Promise<DataSnapshot | null>;
  /** Applique un lot de mutations de facon groupee (une transaction). */
  commit(mutations: Mutation[]): Promise<void>;
}
