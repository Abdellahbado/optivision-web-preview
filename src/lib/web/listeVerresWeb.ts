import { mockClients, mockCommandes, mockOrdonnances } from '@/lib/mockData';
import type {
  GroupedLensItem,
  ListeVerreItem,
  ListeVerres,
  ListeVerresStatut,
  ListeVerresWithItems,
} from '@/types';

interface StoreShape {
  listes: ListeVerres[];
  items: ListeVerreItem[];
  nextListeId: number;
  nextItemId: number;
}

const STORAGE_KEY = 'optivision_web_liste_verres_v1';

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

function nowIso(): string {
  return new Date().toISOString();
}

function readStore(): StoreShape {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { listes: [], items: [], nextListeId: 1, nextItemId: 1 };
  }
  try {
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      listes: parsed.listes || [],
      items: parsed.items || [],
      nextListeId: parsed.nextListeId || 1,
      nextItemId: parsed.nextItemId || 1,
    };
  } catch {
    return { listes: [], items: [], nextListeId: 1, nextItemId: 1 };
  }
}

function writeStore(store: StoreShape): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function withCounts(list: ListeVerres, items: ListeVerreItem[]): ListeVerres {
  const listItems = items.filter((i) => i.liste_id === list.id);
  return {
    ...list,
    items_count: listItems.length,
    items_en_stock: listItems.filter((i) => i.en_stock).length,
  };
}

function buildLensLabelFromOrdonnance(
  eye: 'OD' | 'OG',
  ordonnanceId: number | undefined
): Omit<ListeVerreItem, 'id' | 'liste_id' | 'commande_id' | 'commande_verre_id' | 'client_nom' | 'en_stock'> {
  const ord = mockOrdonnances.find((o) => o.id === ordonnanceId);
  if (!ord) {
    return { oeil: eye, type_verre: 'unifocal' };
  }

  const isProgressive = ord.type_vision === 'VL+VP';
  return {
    oeil: eye,
    type_verre: isProgressive ? 'progressif' : 'unifocal',
    indice: 1.5,
    sphere: eye === 'OD' ? ord.od_sphere : ord.og_sphere,
    cylindre: eye === 'OD' ? ord.od_cylindre : ord.og_cylindre,
    axe: eye === 'OD' ? ord.od_axe : ord.og_axe,
    addition: eye === 'OD' ? ord.od_addition : ord.og_addition,
    traitements: isProgressive ? 'antireflet' : '',
  };
}

export async function getOrCreateTodayListWeb(): Promise<ListeVerres> {
  const store = readStore();
  const today = todayIsoDate();
  const existing = store.listes.find((l) => l.date === today);
  if (existing) return withCounts(existing, store.items);

  const newList: ListeVerres = {
    id: store.nextListeId,
    date: today,
    statut: 'BROUILLON',
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  store.listes.push(newList);
  store.nextListeId += 1;
  writeStore(store);
  return withCounts(newList, store.items);
}

export async function getListesWeb(): Promise<ListeVerres[]> {
  const store = readStore();
  return store.listes
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((l) => withCounts(l, store.items));
}

export async function getListeByIdWeb(id: number): Promise<ListeVerresWithItems | null> {
  const store = readStore();
  const list = store.listes.find((l) => l.id === id);
  if (!list) return null;
  return {
    ...withCounts(list, store.items),
    items: store.items.filter((i) => i.liste_id === id).sort((a, b) => {
      const aClient = a.client_nom || '';
      const bClient = b.client_nom || '';
      if (aClient !== bClient) return aClient.localeCompare(bClient);
      return a.oeil.localeCompare(b.oeil);
    }),
  };
}

export async function updateListeItemWeb(
  id: number,
  updates: Partial<ListeVerreItem>
): Promise<ListeVerreItem> {
  const store = readStore();
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx < 0) throw new Error('Élément introuvable');
  store.items[idx] = {
    ...store.items[idx],
    en_stock: updates.en_stock ?? store.items[idx].en_stock,
    notes: updates.notes ?? store.items[idx].notes,
  };
  writeStore(store);
  return store.items[idx];
}

export async function deleteListeItemWeb(id: number): Promise<void> {
  const store = readStore();
  store.items = store.items.filter((i) => i.id !== id);
  writeStore(store);
}

export async function updateListeStatutWeb(
  id: number,
  statut: ListeVerresStatut,
  notes?: string
): Promise<ListeVerres> {
  const store = readStore();
  const idx = store.listes.findIndex((l) => l.id === id);
  if (idx < 0) throw new Error('Liste introuvable');
  store.listes[idx] = {
    ...store.listes[idx],
    statut,
    notes: notes || store.listes[idx].notes,
    updated_at: nowIso(),
  };
  writeStore(store);
  return withCounts(store.listes[idx], store.items);
}

export async function populateListeFromOrdersWeb(listeId: number, date: string): Promise<number> {
  const store = readStore();
  const list = store.listes.find((l) => l.id === listeId);
  if (!list) throw new Error('Liste introuvable');

  const commandsForDate = mockCommandes.filter((cmd) => cmd.date_commande === date);
  if (commandsForDate.length === 0) return 0;

  let added = 0;
  for (const cmd of commandsForDate) {
    const client = mockClients.find((c) => c.id === cmd.client_id);
    const clientNom = client ? `${client.prenom} ${client.nom}` : 'Client';

    const alreadyForOrder = store.items.some(
      (i) => i.liste_id === listeId && i.commande_id === cmd.id
    );
    if (alreadyForOrder) continue;

    const odLens = buildLensLabelFromOrdonnance('OD', cmd.ordonnance_id);
    const ogLens = buildLensLabelFromOrdonnance('OG', cmd.ordonnance_id);

    store.items.push({
      id: store.nextItemId++,
      liste_id: listeId,
      commande_id: cmd.id,
      client_nom: clientNom,
      en_stock: false,
      ...odLens,
    });
    store.items.push({
      id: store.nextItemId++,
      liste_id: listeId,
      commande_id: cmd.id,
      client_nom: clientNom,
      en_stock: false,
      ...ogLens,
    });
    added += 2;
  }

  writeStore(store);
  return added;
}

export function groupLensItemsWeb(items: ListeVerreItem[]): GroupedLensItem[] {
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
    } else {
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
  }

  return [...groups.values()].sort((a, b) => {
    if (a.type_verre !== b.type_verre) {
      return (a.type_verre || '').localeCompare(b.type_verre || '');
    }
    if (a.indice !== b.indice) {
      return (a.indice || 0) - (b.indice || 0);
    }
    return (a.sphere || 0) - (b.sphere || 0);
  });
}
