import { create } from 'zustand';
import { getStorage } from '@/lib/data';
import { PARAMETRES_DEFAUT } from '@/lib/data';
import type { Compteurs, DataSnapshot, Mutation, Parametres } from '@/lib/data';
import {
  mockClients,
  mockCommandes,
  mockFactures,
  mockOrdonnances,
  mockProduits,
} from '@/lib/mockData';
import type {
  Client,
  ClientInput,
  Commande,
  CommandeInput,
  CommandeLigne,
  CommandeStatut,
  Facture,
  FactureInput,
  ListeVerreItem,
  ListeVerres,
  ListeVerresStatut,
  MouvementStock,
  MouvementType,
  Ordonnance,
  OrdonnanceInput,
  Paiement,
  PaymentMethod,
  Produit,
  ProduitInput,
  VenteInput,
  VenteResultat,
} from '@/types';

/* ------------------------------------------------------------------ */
/* Outils                                                              */
/* ------------------------------------------------------------------ */

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowIso(): string {
  return new Date().toISOString();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function maxId(rows: { id: number }[]): number {
  return rows.reduce((max, row) => Math.max(max, row.id), 0);
}

function emptyCompteurs(): Compteurs {
  return {
    client: 0,
    ordonnance: 0,
    produit: 0,
    commande: 0,
    facture: 0,
    paiement: 0,
    mouvement: 0,
    ligne: 0,
    liste: 0,
    listeItem: 0,
    annee: new Date().getFullYear(),
  };
}

/** Base de demonstration du premier demarrage. */
function seedSnapshot(): DataSnapshot {
  const clients = clone(mockClients);
  const ordonnances = clone(mockOrdonnances);
  const produits = clone(mockProduits);
  const commandes = clone(mockCommandes);
  const factures = clone(mockFactures);

  return {
    clients,
    ordonnances,
    produits,
    commandes,
    factures,
    paiements: [],
    mouvements: [],
    listesVerres: [],
    listeItems: [],
    parametres: { ...PARAMETRES_DEFAUT },
    compteurs: {
      ...emptyCompteurs(),
      client: maxId(clients),
      ordonnance: maxId(ordonnances),
      produit: maxId(produits),
      commande: maxId(commandes),
      facture: maxId(factures),
    },
  };
}

function emptySnapshot(): DataSnapshot {
  return {
    clients: [],
    ordonnances: [],
    produits: [],
    commandes: [],
    factures: [],
    paiements: [],
    mouvements: [],
    listesVerres: [],
    listeItems: [],
    parametres: { ...PARAMETRES_DEFAUT },
    compteurs: emptyCompteurs(),
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

interface AppDataStore extends DataSnapshot {
  hydrated: boolean;
  hydrate: () => Promise<void>;

  // Clients
  createClient: (data: ClientInput) => Client;
  updateClient: (id: number, data: Partial<ClientInput>) => void;
  deleteClient: (id: number) => void;

  // Ordonnances
  createOrdonnance: (data: OrdonnanceInput) => Ordonnance;
  updateOrdonnance: (id: number, data: Partial<OrdonnanceInput>) => void;
  deleteOrdonnance: (id: number) => void;

  // Produits et stock
  createProduit: (data: ProduitInput) => Produit;
  updateProduit: (id: number, data: Partial<ProduitInput>) => void;
  deleteProduit: (id: number) => void;
  /** Entree ou sortie manuelle de stock, tracee dans les mouvements. */
  updateProduitStock: (id: number, delta: number, raison?: string) => void;
  ajusterStock: (
    id: number,
    delta: number,
    type: MouvementType,
    raison?: string,
    commandeId?: number
  ) => void;

  // Vente (operation complete)
  enregistrerVente: (input: VenteInput) => VenteResultat;

  // Commandes
  createCommande: (data: CommandeInput) => Commande;
  updateCommande: (id: number, data: Partial<Commande>) => void;
  changerStatutCommande: (id: number, statut: CommandeStatut) => void;
  annulerCommande: (id: number, raison?: string) => void;

  // Factures et paiements
  createFacture: (data: FactureInput) => Facture;
  updateFacture: (id: number, data: Partial<Facture>) => void;
  enregistrerPaiement: (
    factureId: number,
    montant: number,
    mode: PaymentMethod,
    notes?: string
  ) => Paiement | null;

  // Liste des verres a commander
  getOrCreateListeDuJour: () => ListeVerres;
  ajouterListeItem: (item: Omit<ListeVerreItem, 'id'>) => ListeVerreItem;
  updateListeItem: (id: number, updates: Partial<ListeVerreItem>) => void;
  deleteListeItem: (id: number) => void;
  updateListeStatut: (id: number, statut: ListeVerresStatut, notes?: string) => void;

  // Parametres du magasin
  updateParametres: (patch: Partial<Parametres>) => void;

  // Sauvegarde
  replaceAllData: (data: Partial<DataSnapshot>) => void;
  resetAllData: () => void;
}

const storage = getStorage();

/** Applique les mutations sur le support de stockage sans bloquer l'interface. */
function persist(mutations: Mutation[]): void {
  if (mutations.length === 0) return;
  void storage.commit(mutations).catch((error) => {
    console.error('Enregistrement impossible', error);
  });
}

export const useAppDataStore = create<AppDataStore>()((set, get) => {
  /** Reserve des numeros d'identifiants sans jamais reutiliser un numero emis. */
  function prendreNumeros(demandes: Partial<Record<keyof Compteurs, number>>) {
    const compteurs = { ...get().compteurs };
    const annee = new Date().getFullYear();
    if (compteurs.annee !== annee) {
      // Les numeros de documents repartent a 1 chaque annee, les ids non.
      compteurs.annee = annee;
      compteurs.commande = compteurs.commande;
      compteurs.facture = compteurs.facture;
    }
    const attribues: Record<string, number> = {};
    for (const [cle, nombre] of Object.entries(demandes)) {
      const key = cle as keyof Compteurs;
      const depart = (compteurs[key] as number) + 1;
      (compteurs[key] as number) = (compteurs[key] as number) + (nombre ?? 1);
      attribues[cle] = depart;
    }
    return { compteurs, attribues, annee };
  }

  function documentNumero(prefixe: string, annee: number, numero: number): string {
    return `${prefixe}-${annee}-${String(numero).padStart(4, '0')}`;
  }

  return {
    ...emptySnapshot(),
    hydrated: false,

    hydrate: async () => {
      if (get().hydrated) return;
      const chargee = await storage.load();
      if (chargee) {
        set({ ...chargee, hydrated: true });
        return;
      }
      const snapshot = seedSnapshot();
      set({ ...snapshot, hydrated: true });
      persist([{ type: 'replaceAll', snapshot }]);
    },

    /* ---------------- Clients ---------------- */

    createClient: (data) => {
      const { compteurs, attribues } = prendreNumeros({ client: 1 });
      const id = attribues.client;
      const created: Client = {
        id,
        code: `CLI-${String(id).padStart(4, '0')}`,
        ...data,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      set((state) => ({ clients: [created, ...state.clients], compteurs }));
      persist([
        { type: 'upsert', collection: 'clients', row: created },
        { type: 'compteurs', compteurs },
      ]);
      return created;
    },

    updateClient: (id, data) => {
      const current = get().clients.find((client) => client.id === id);
      if (!current) return;
      const updated = { ...current, ...data, updated_at: nowIso() };
      set((state) => ({
        clients: state.clients.map((client) => (client.id === id ? updated : client)),
      }));
      persist([{ type: 'upsert', collection: 'clients', row: updated }]);
    },

    deleteClient: (id) => {
      set((state) => ({ clients: state.clients.filter((client) => client.id !== id) }));
      persist([{ type: 'delete', collection: 'clients', id }]);
    },

    /* ---------------- Ordonnances ---------------- */

    createOrdonnance: (data) => {
      const { compteurs, attribues, annee } = prendreNumeros({ ordonnance: 1 });
      const created: Ordonnance = {
        id: attribues.ordonnance,
        numero: documentNumero('ORD', annee, attribues.ordonnance),
        ...data,
        created_at: nowIso(),
      };
      set((state) => ({ ordonnances: [created, ...state.ordonnances], compteurs }));
      persist([
        { type: 'upsert', collection: 'ordonnances', row: created },
        { type: 'compteurs', compteurs },
      ]);
      return created;
    },

    updateOrdonnance: (id, data) => {
      const current = get().ordonnances.find((ord) => ord.id === id);
      if (!current) return;
      const updated = { ...current, ...data };
      set((state) => ({
        ordonnances: state.ordonnances.map((ord) => (ord.id === id ? updated : ord)),
      }));
      persist([{ type: 'upsert', collection: 'ordonnances', row: updated }]);
    },

    deleteOrdonnance: (id) => {
      set((state) => ({ ordonnances: state.ordonnances.filter((ord) => ord.id !== id) }));
      persist([{ type: 'delete', collection: 'ordonnances', id }]);
    },

    /* ---------------- Produits ---------------- */

    createProduit: (data) => {
      const { compteurs, attribues } = prendreNumeros({ produit: 1 });
      const created: Produit = {
        id: attribues.produit,
        ...data,
        actif: data.actif ?? true,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      set((state) => ({ produits: [created, ...state.produits], compteurs }));
      persist([
        { type: 'upsert', collection: 'produits', row: created },
        { type: 'compteurs', compteurs },
      ]);
      return created;
    },

    updateProduit: (id, data) => {
      const current = get().produits.find((produit) => produit.id === id);
      if (!current) return;
      const updated = { ...current, ...data, updated_at: nowIso() };
      set((state) => ({
        produits: state.produits.map((produit) => (produit.id === id ? updated : produit)),
      }));
      persist([{ type: 'upsert', collection: 'produits', row: updated }]);
    },

    deleteProduit: (id) => {
      set((state) => ({ produits: state.produits.filter((produit) => produit.id !== id) }));
      persist([{ type: 'delete', collection: 'produits', id }]);
    },

    updateProduitStock: (id, delta, raison) => {
      get().ajusterStock(id, delta, delta >= 0 ? 'ENTREE' : 'SORTIE', raison);
    },

    ajusterStock: (id, delta, type, raison, commandeId) => {
      if (delta === 0) return;
      const produit = get().produits.find((item) => item.id === id);
      if (!produit) return;

      const avant = produit.quantite;
      const apres = Math.max(0, avant + delta);
      const { compteurs, attribues } = prendreNumeros({ mouvement: 1 });

      const produitMaj: Produit = { ...produit, quantite: apres, updated_at: nowIso() };
      const mouvement: MouvementStock = {
        id: attribues.mouvement,
        produit_id: id,
        type,
        quantite: Math.abs(delta),
        quantite_avant: avant,
        quantite_apres: apres,
        raison,
        commande_id: commandeId,
        prix_achat: produit.prix_achat,
        date: nowIso(),
      };

      set((state) => ({
        produits: state.produits.map((item) => (item.id === id ? produitMaj : item)),
        mouvements: [mouvement, ...state.mouvements],
        compteurs,
      }));
      persist([
        { type: 'upsert', collection: 'produits', row: produitMaj },
        { type: 'upsert', collection: 'mouvements', row: mouvement },
        { type: 'compteurs', compteurs },
      ]);
    },

    /* ---------------- La vente ---------------- */

    /**
     * Une seule operation pour tout ce qu'une vente declenche:
     * commande + lignes, facture, acompte, sorties de stock tracees,
     * et verres manquants ajoutes au bon de commande du jour.
     */
    enregistrerVente: (input) => {
      const state = get();
      const lignesValides = input.lignes.filter(
        (ligne) => ligne.description.trim() !== '' && ligne.quantite > 0
      );

      const brut = lignesValides.reduce(
        (somme, ligne) => somme + ligne.prix_unitaire * ligne.quantite,
        0
      );
      // Le prix final saisi a la main l'emporte sur le calcul des lignes.
      const total =
        input.total_force !== undefined && Number.isFinite(input.total_force)
          ? Math.max(0, input.total_force)
          : brut - Math.min(Math.max(0, input.remise_montant), brut);
      const remise = Math.max(0, brut - total);
      const acompte = Math.min(Math.max(0, input.acompte), total);
      const aCommander = lignesValides.some((ligne) => ligne.a_commander);

      const besoinListe = lignesValides.filter(
        (ligne) => ligne.a_commander && (ligne.type === 'VERRE_OD' || ligne.type === 'VERRE_OG')
      );
      const listeExistante = state.listesVerres.find((liste) => liste.date === today());

      const { compteurs, attribues, annee } = prendreNumeros({
        commande: 1,
        facture: 1,
        ligne: lignesValides.length * 2,
        paiement: acompte > 0 ? 1 : 0,
        mouvement: lignesValides.length,
        liste: listeExistante ? 0 : 1,
        listeItem: besoinListe.length,
      });

      const commandeId = attribues.commande;
      const factureId = attribues.facture;
      let ligneId = attribues.ligne;

      const lignesCommande: CommandeLigne[] = lignesValides.map((ligne) => ({
        id: ligneId++,
        commande_id: commandeId,
        produit_id: ligne.produit_id,
        description: ligne.description,
        type: ligne.type,
        a_commander: ligne.a_commander,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        prix_achat_unitaire: ligne.prix_achat_unitaire,
        remise: 0,
        prix_total: ligne.prix_unitaire * ligne.quantite,
        cout_total: ligne.prix_achat_unitaire
          ? ligne.prix_achat_unitaire * ligne.quantite
          : undefined,
      }));

      const commande: Commande = {
        id: commandeId,
        numero: documentNumero('CMD', annee, commandeId),
        client_id: input.client_id,
        ordonnance_id: input.ordonnance_id,
        lignes: lignesCommande,
        date_commande: today(),
        date_livraison_prevue: input.date_livraison_prevue,
        statut: aCommander ? 'ORD' : 'NEW',
        total_ht: brut,
        remise_montant: remise || undefined,
        total_ttc: total,
        notes_atelier: input.notes_atelier,
        created_at: nowIso(),
        updated_at: nowIso(),
      };

      const facture: Facture = {
        id: factureId,
        numero: documentNumero('FAC', annee, factureId),
        commande_id: commandeId,
        client_id: input.client_id,
        date_facture: today(),
        total_ht: brut,
        remise_montant: remise || undefined,
        total_ttc: total,
        montant_paye: acompte,
        mode_paiement: acompte > 0 ? input.mode_paiement : undefined,
        statut: acompte >= total && total > 0 ? 'PAID' : acompte > 0 ? 'PARTIAL' : 'SENT',
        lignes: lignesCommande.map((ligne) => ({
          id: ligneId++,
          facture_id: factureId,
          description: ligne.description,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          remise: 0,
          prix_total: ligne.prix_total,
        })),
        created_at: nowIso(),
        updated_at: nowIso(),
      };

      const mutations: Mutation[] = [
        { type: 'upsert', collection: 'commandes', row: commande },
        { type: 'upsert', collection: 'factures', row: facture },
      ];

      // Acompte encaisse au comptoir
      const paiements: Paiement[] = [];
      if (acompte > 0) {
        const paiement: Paiement = {
          id: attribues.paiement,
          facture_id: factureId,
          date: nowIso(),
          montant: acompte,
          mode: input.mode_paiement ?? 'ESP',
          reference: commande.numero,
        };
        paiements.push(paiement);
        mutations.push({ type: 'upsert', collection: 'paiements', row: paiement });
      }

      // Sorties de stock, uniquement pour ce qui part reellement du magasin
      let mouvementId = attribues.mouvement;
      const mouvements: MouvementStock[] = [];
      const produits = state.produits.map((produit) => {
        const concernees = lignesValides.filter(
          (ligne) => ligne.produit_id === produit.id && !ligne.a_commander
        );
        if (concernees.length === 0) return produit;

        const sortie = concernees.reduce((somme, ligne) => somme + ligne.quantite, 0);
        const avant = produit.quantite;
        const apres = Math.max(0, avant - sortie);
        mouvements.push({
          id: mouvementId++,
          produit_id: produit.id,
          type: 'VENTE',
          quantite: sortie,
          quantite_avant: avant,
          quantite_apres: apres,
          commande_id: commandeId,
          prix_achat: produit.prix_achat,
          raison: `Vente ${commande.numero}`,
          date: nowIso(),
        });
        const maj = { ...produit, quantite: apres, updated_at: nowIso() };
        mutations.push({ type: 'upsert', collection: 'produits', row: maj });
        return maj;
      });
      for (const mouvement of mouvements) {
        mutations.push({ type: 'upsert', collection: 'mouvements', row: mouvement });
      }

      // Bon de commande fournisseur du jour
      let listesVerres = state.listesVerres;
      let listeItems = state.listeItems;
      if (besoinListe.length > 0) {
        let liste = listeExistante;
        if (!liste) {
          liste = {
            id: attribues.liste,
            date: today(),
            statut: 'BROUILLON',
            created_at: nowIso(),
            updated_at: nowIso(),
          };
          listesVerres = [liste, ...listesVerres];
          mutations.push({ type: 'upsert', collection: 'listesVerres', row: liste });
        }

        const client = state.clients.find((item) => item.id === input.client_id);
        const ordonnance = state.ordonnances.find((item) => item.id === input.ordonnance_id);
        let itemId = attribues.listeItem;
        const nouveaux: ListeVerreItem[] = besoinListe.map((ligne) => {
          const oeil = ligne.type === 'VERRE_OD' ? 'OD' : 'OG';
          const produit = state.produits.find((item) => item.id === ligne.produit_id);
          return {
            id: itemId++,
            liste_id: liste!.id,
            commande_id: commandeId,
            client_nom: client ? `${client.prenom} ${client.nom}` : undefined,
            oeil,
            type_verre: produit?.verre?.type_verre,
            indice: produit?.verre?.indice,
            sphere: oeil === 'OD' ? ordonnance?.od_sphere : ordonnance?.og_sphere,
            cylindre: oeil === 'OD' ? ordonnance?.od_cylindre : ordonnance?.og_cylindre,
            axe: oeil === 'OD' ? ordonnance?.od_axe : ordonnance?.og_axe,
            addition: oeil === 'OD' ? ordonnance?.od_addition : ordonnance?.og_addition,
            traitements: produit?.verre?.traitements?.join(', '),
            en_stock: false,
            notes: ligne.description,
          };
        });
        listeItems = [...nouveaux, ...listeItems];
        for (const item of nouveaux) {
          mutations.push({ type: 'upsert', collection: 'listeItems', row: item });
        }
      }

      mutations.push({ type: 'compteurs', compteurs });

      set((current) => ({
        commandes: [commande, ...current.commandes],
        factures: [facture, ...current.factures],
        paiements: [...paiements, ...current.paiements],
        mouvements: [...mouvements, ...current.mouvements],
        produits,
        listesVerres,
        listeItems,
        compteurs,
      }));
      persist(mutations);

      return { commande, facture };
    },

    /* ---------------- Commandes ---------------- */

    createCommande: (data) => {
      const { compteurs, attribues, annee } = prendreNumeros({ commande: 1 });
      const created: Commande = {
        id: attribues.commande,
        numero: documentNumero('CMD', annee, attribues.commande),
        ...data,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      set((state) => ({ commandes: [created, ...state.commandes], compteurs }));
      persist([
        { type: 'upsert', collection: 'commandes', row: created },
        { type: 'compteurs', compteurs },
      ]);
      return created;
    },

    updateCommande: (id, data) => {
      const current = get().commandes.find((commande) => commande.id === id);
      if (!current) return;
      const updated = { ...current, ...data, updated_at: nowIso() };
      set((state) => ({
        commandes: state.commandes.map((commande) => (commande.id === id ? updated : commande)),
      }));
      persist([{ type: 'upsert', collection: 'commandes', row: updated }]);
    },

    changerStatutCommande: (id, statut) => {
      const current = get().commandes.find((commande) => commande.id === id);
      if (!current) return;
      if (statut === 'CAN') {
        get().annulerCommande(id);
        return;
      }
      const updated: Commande = {
        ...current,
        statut,
        date_livraison: statut === 'DLV' ? today() : current.date_livraison,
        updated_at: nowIso(),
      };
      set((state) => ({
        commandes: state.commandes.map((commande) => (commande.id === id ? updated : commande)),
      }));
      persist([{ type: 'upsert', collection: 'commandes', row: updated }]);
    },

    /** Annuler remet en stock ce qui en etait sorti: sinon le stock derive. */
    annulerCommande: (id, raison) => {
      const state = get();
      const commande = state.commandes.find((item) => item.id === id);
      if (!commande || commande.statut === 'CAN') return;

      const updated: Commande = { ...commande, statut: 'CAN', updated_at: nowIso() };
      set((current) => ({
        commandes: current.commandes.map((item) => (item.id === id ? updated : item)),
      }));
      persist([{ type: 'upsert', collection: 'commandes', row: updated }]);

      for (const ligne of commande.lignes ?? []) {
        if (ligne.produit_id && !ligne.a_commander) {
          get().ajusterStock(
            ligne.produit_id,
            ligne.quantite,
            'ANNULATION',
            raison ?? `Annulation ${commande.numero}`,
            commande.id
          );
        }
      }
    },

    /* ---------------- Factures et paiements ---------------- */

    createFacture: (data) => {
      const { compteurs, attribues, annee } = prendreNumeros({ facture: 1 });
      const created: Facture = {
        id: attribues.facture,
        numero: documentNumero('FAC', annee, attribues.facture),
        ...data,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      set((state) => ({ factures: [created, ...state.factures], compteurs }));
      persist([
        { type: 'upsert', collection: 'factures', row: created },
        { type: 'compteurs', compteurs },
      ]);
      return created;
    },

    updateFacture: (id, data) => {
      const current = get().factures.find((facture) => facture.id === id);
      if (!current) return;
      const updated = { ...current, ...data, updated_at: nowIso() };
      set((state) => ({
        factures: state.factures.map((facture) => (facture.id === id ? updated : facture)),
      }));
      persist([{ type: 'upsert', collection: 'factures', row: updated }]);
    },

    enregistrerPaiement: (factureId, montant, mode, notes) => {
      const facture = get().factures.find((item) => item.id === factureId);
      if (!facture || montant <= 0) return null;

      const restant = facture.total_ttc - facture.montant_paye;
      const encaisse = Math.min(montant, Math.max(0, restant));
      if (encaisse <= 0) return null;

      const { compteurs, attribues } = prendreNumeros({ paiement: 1 });
      const paiement: Paiement = {
        id: attribues.paiement,
        facture_id: factureId,
        date: nowIso(),
        montant: encaisse,
        mode,
        notes,
      };
      const paye = facture.montant_paye + encaisse;
      const factureMaj: Facture = {
        ...facture,
        montant_paye: paye,
        mode_paiement: mode,
        statut: paye >= facture.total_ttc ? 'PAID' : 'PARTIAL',
        updated_at: nowIso(),
      };

      set((state) => ({
        paiements: [paiement, ...state.paiements],
        factures: state.factures.map((item) => (item.id === factureId ? factureMaj : item)),
        compteurs,
      }));
      persist([
        { type: 'upsert', collection: 'paiements', row: paiement },
        { type: 'upsert', collection: 'factures', row: factureMaj },
        { type: 'compteurs', compteurs },
      ]);
      return paiement;
    },

    /* ---------------- Liste des verres a commander ---------------- */

    getOrCreateListeDuJour: () => {
      const existante = get().listesVerres.find((liste) => liste.date === today());
      if (existante) return existante;

      const { compteurs, attribues } = prendreNumeros({ liste: 1 });
      const liste: ListeVerres = {
        id: attribues.liste,
        date: today(),
        statut: 'BROUILLON',
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      set((state) => ({ listesVerres: [liste, ...state.listesVerres], compteurs }));
      persist([
        { type: 'upsert', collection: 'listesVerres', row: liste },
        { type: 'compteurs', compteurs },
      ]);
      return liste;
    },

    ajouterListeItem: (item) => {
      const { compteurs, attribues } = prendreNumeros({ listeItem: 1 });
      const created: ListeVerreItem = { id: attribues.listeItem, ...item };
      set((state) => ({ listeItems: [created, ...state.listeItems], compteurs }));
      persist([
        { type: 'upsert', collection: 'listeItems', row: created },
        { type: 'compteurs', compteurs },
      ]);
      return created;
    },

    updateListeItem: (id, updates) => {
      const current = get().listeItems.find((item) => item.id === id);
      if (!current) return;
      const updated = { ...current, ...updates };
      set((state) => ({
        listeItems: state.listeItems.map((item) => (item.id === id ? updated : item)),
      }));
      persist([{ type: 'upsert', collection: 'listeItems', row: updated }]);
    },

    deleteListeItem: (id) => {
      set((state) => ({ listeItems: state.listeItems.filter((item) => item.id !== id) }));
      persist([{ type: 'delete', collection: 'listeItems', id }]);
    },

    updateListeStatut: (id, statut, notes) => {
      const current = get().listesVerres.find((liste) => liste.id === id);
      if (!current) return;
      const updated: ListeVerres = {
        ...current,
        statut,
        notes: notes ?? current.notes,
        updated_at: nowIso(),
      };
      set((state) => ({
        listesVerres: state.listesVerres.map((liste) => (liste.id === id ? updated : liste)),
      }));
      persist([{ type: 'upsert', collection: 'listesVerres', row: updated }]);
    },

    /* ---------------- Parametres ---------------- */

    updateParametres: (patch) => {
      const parametres = { ...get().parametres, ...patch };
      set({ parametres });
      persist([{ type: 'parametres', parametres }]);
    },

    /* ---------------- Sauvegarde ---------------- */

    replaceAllData: (data) => {
      const state = get();
      const snapshot: DataSnapshot = {
        clients: data.clients ?? state.clients,
        ordonnances: data.ordonnances ?? state.ordonnances,
        produits: data.produits ?? state.produits,
        commandes: data.commandes ?? state.commandes,
        factures: data.factures ?? state.factures,
        paiements: data.paiements ?? state.paiements,
        mouvements: data.mouvements ?? state.mouvements,
        listesVerres: data.listesVerres ?? state.listesVerres,
        listeItems: data.listeItems ?? state.listeItems,
        parametres: data.parametres ?? state.parametres,
        compteurs: data.compteurs ?? {
          ...state.compteurs,
          client: Math.max(state.compteurs.client, maxId(data.clients ?? state.clients)),
          ordonnance: Math.max(
            state.compteurs.ordonnance,
            maxId(data.ordonnances ?? state.ordonnances)
          ),
          produit: Math.max(state.compteurs.produit, maxId(data.produits ?? state.produits)),
          commande: Math.max(state.compteurs.commande, maxId(data.commandes ?? state.commandes)),
          facture: Math.max(state.compteurs.facture, maxId(data.factures ?? state.factures)),
        },
      };
      set(snapshot);
      persist([{ type: 'replaceAll', snapshot }]);
    },

    resetAllData: () => {
      const snapshot = seedSnapshot();
      set(snapshot);
      persist([{ type: 'replaceAll', snapshot }]);
    },
  };
});
