import { useAppDataStore } from '@/stores/appDataStore';
import type { GroupedLensItem, ListeVerreItem } from '@/types';

/** Regroupe les verres identiques pour que le bon de commande tienne en peu de lignes. */
export function groupLensItems(items: ListeVerreItem[]): GroupedLensItem[] {
  const groups = new Map<string, GroupedLensItem>();

  for (const item of items) {
    const key = [
      item.type_verre || '',
      item.indice?.toString() || '',
      item.sphere?.toString() || '',
      item.cylindre?.toString() || '',
      item.axe?.toString() || '',
      item.addition?.toString() || '',
      item.traitements || '',
    ].join('|');

    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.items.push(item);
      existing.allInStock = existing.allInStock && item.en_stock;
      continue;
    }
    groups.set(key, {
      type_verre: item.type_verre,
      indice: item.indice,
      sphere: item.sphere,
      cylindre: item.cylindre,
      axe: item.axe,
      addition: item.addition,
      traitements: item.traitements,
      count: 1,
      items: [item],
      allInStock: item.en_stock,
    });
  }

  return [...groups.values()].sort((a, b) => {
    if (a.type_verre !== b.type_verre) {
      return (a.type_verre || '').localeCompare(b.type_verre || '');
    }
    if (a.indice !== b.indice) return (a.indice || 0) - (b.indice || 0);
    return (a.sphere || 0) - (b.sphere || 0);
  });
}

/**
 * Ajoute a la liste du jour les verres a commander issus des commandes
 * qui n'y figurent pas encore. Sert de rattrapage manuel.
 */
export function synchroniserListeDepuisCommandes(listeId: number, date: string): number {
  const state = useAppDataStore.getState();
  const dejaPresentes = new Set(
    state.listeItems
      .filter((item) => item.liste_id === listeId)
      .map((item) => `${item.commande_id}-${item.oeil}`)
  );

  const aAjouter: Omit<ListeVerreItem, 'id'>[] = [];

  for (const commande of state.commandes) {
    if (commande.date_commande !== date || commande.statut === 'CAN') continue;
    const client = state.clients.find((item) => item.id === commande.client_id);
    const ordonnance = state.ordonnances.find((item) => item.id === commande.ordonnance_id);

    for (const ligne of commande.lignes ?? []) {
      if (!ligne.a_commander) continue;
      if (ligne.type !== 'VERRE_OD' && ligne.type !== 'VERRE_OG') continue;
      const oeil = ligne.type === 'VERRE_OD' ? 'OD' : 'OG';
      if (dejaPresentes.has(`${commande.id}-${oeil}`)) continue;

      const produit = state.produits.find((item) => item.id === ligne.produit_id);
      aAjouter.push({
        liste_id: listeId,
        commande_id: commande.id,
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
      });
    }
  }

  for (const item of aAjouter) {
    useAppDataStore.getState().ajouterListeItem(item);
  }
  return aAjouter.length;
}
