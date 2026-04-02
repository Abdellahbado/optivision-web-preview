export interface Client {
  id: number;
  code: string;
  prenom: string;
  nom: string;
  telephone: string;
  telephone2?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  date_naissance?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientWithStats extends Client {
  derniere_visite?: string;
  total_achats: number;
  solde: number;
  nombre_commandes: number;
}

export type ClientInput = Omit<Client, 'id' | 'code' | 'created_at' | 'updated_at'>;
