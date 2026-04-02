import { query, execute } from './db';
import type { 
  ListeVerres, 
  ListeVerreItem, 
  ListeVerreItemInput,
  ListeVerresStatut,
  ListeVerresWithItems,
  GroupedLensItem
} from '@/types';

// Get or create today's lens list
export async function getOrCreateTodayList(): Promise<ListeVerres> {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if today's list exists
  const existing = await query<ListeVerres>(
    'SELECT * FROM listes_verres WHERE date = ?',
    [today]
  );
  
  if (existing[0]) {
    return existing[0];
  }
  
  // Create new list for today
  const result = await execute(
    'INSERT INTO listes_verres (date, statut) VALUES (?, ?)',
    [today, 'BROUILLON']
  );
  
  const created = await query<ListeVerres>(
    'SELECT * FROM listes_verres WHERE id = ?',
    [result.lastInsertId]
  );
  
  return created[0];
}

// Get list by date
export async function getListeByDate(date: string): Promise<ListeVerres | null> {
  const results = await query<ListeVerres>(
    'SELECT * FROM listes_verres WHERE date = ?',
    [date]
  );
  return results[0] || null;
}

// Get list by ID with items
export async function getListeById(id: number): Promise<ListeVerresWithItems | null> {
  const liste = await query<ListeVerres>(
    'SELECT * FROM listes_verres WHERE id = ?',
    [id]
  );
  
  if (!liste[0]) return null;
  
  const items = await query<ListeVerreItem>(
    'SELECT * FROM liste_verre_items WHERE liste_id = ? ORDER BY client_nom, oeil',
    [id]
  );
  
  return { ...liste[0], items };
}

// Get all lists with counts
export async function getListes(filters?: {
  dateFrom?: string;
  dateTo?: string;
  statut?: ListeVerresStatut;
}): Promise<ListeVerres[]> {
  let sql = `
    SELECT 
      lv.*,
      COUNT(lvi.id) as items_count,
      SUM(CASE WHEN lvi.en_stock = 1 THEN 1 ELSE 0 END) as items_en_stock
    FROM listes_verres lv
    LEFT JOIN liste_verre_items lvi ON lv.id = lvi.liste_id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  
  if (filters?.dateFrom) {
    sql += ' AND lv.date >= ?';
    params.push(filters.dateFrom);
  }
  
  if (filters?.dateTo) {
    sql += ' AND lv.date <= ?';
    params.push(filters.dateTo);
  }
  
  if (filters?.statut) {
    sql += ' AND lv.statut = ?';
    params.push(filters.statut);
  }
  
  sql += ' GROUP BY lv.id ORDER BY lv.date DESC';
  
  return query<ListeVerres>(sql, params);
}

// Add item to list
export async function addListeItem(item: ListeVerreItemInput): Promise<ListeVerreItem> {
  const result = await execute(`
    INSERT INTO liste_verre_items (
      liste_id, commande_id, commande_verre_id, client_nom, oeil,
      type_verre, indice, sphere, cylindre, axe, addition, traitements, en_stock, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    item.liste_id,
    item.commande_id || null,
    item.commande_verre_id || null,
    item.client_nom || null,
    item.oeil,
    item.type_verre || null,
    item.indice || null,
    item.sphere || null,
    item.cylindre || null,
    item.axe || null,
    item.addition || null,
    item.traitements || null,
    item.en_stock ? 1 : 0,
    item.notes || null
  ]);
  
  const created = await query<ListeVerreItem>(
    'SELECT * FROM liste_verre_items WHERE id = ?',
    [result.lastInsertId]
  );
  
  return created[0];
}

// Update item (mark as in-stock, add notes)
export async function updateListeItem(id: number, updates: Partial<ListeVerreItem>): Promise<ListeVerreItem> {
  const fields: string[] = [];
  const values: unknown[] = [];
  
  if (updates.en_stock !== undefined) {
    fields.push('en_stock = ?');
    values.push(updates.en_stock ? 1 : 0);
  }
  
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes || null);
  }
  
  if (fields.length > 0) {
    values.push(id);
    await execute(`UPDATE liste_verre_items SET ${fields.join(', ')} WHERE id = ?`, values);
  }
  
  const updated = await query<ListeVerreItem>(
    'SELECT * FROM liste_verre_items WHERE id = ?',
    [id]
  );
  
  return updated[0];
}

// Delete item from list
export async function deleteListeItem(id: number): Promise<void> {
  await execute('DELETE FROM liste_verre_items WHERE id = ?', [id]);
}

// Update list status
export async function updateListeStatut(id: number, statut: ListeVerresStatut, notes?: string): Promise<ListeVerres> {
  await execute(
    'UPDATE listes_verres SET statut = ?, notes = ?, updated_at = datetime("now") WHERE id = ?',
    [statut, notes || null, id]
  );
  
  const updated = await query<ListeVerres>(
    'SELECT * FROM listes_verres WHERE id = ?',
    [id]
  );
  
  return updated[0];
}

// Auto-populate list from today's orders
export async function populateListeFromOrders(listeId: number, date: string): Promise<number> {
  // Get all lens details from orders created on the given date that aren't already in a list
  const lensesToAdd = await query<{
    commande_id: number;
    commande_verre_id: number;
    client_nom: string;
    oeil: 'OD' | 'OG';
    type_verre: string;
    indice: number;
    sphere: number;
    cylindre: number;
    axe: number;
    addition: number;
    traitements: string;
  }>(`
    SELECT 
      cv.commande_id,
      cv.id as commande_verre_id,
      c.nom || ' ' || c.prenom as client_nom,
      cv.oeil,
      cv.type_verre,
      cv.indice,
      cv.sphere,
      cv.cylindre,
      cv.axe,
      cv.addition,
      cv.traitements
    FROM commande_verres cv
    JOIN commandes cmd ON cv.commande_id = cmd.id
    JOIN clients c ON cmd.client_id = c.id
    WHERE date(cmd.date_commande) = date(?)
    AND cv.id NOT IN (
      SELECT commande_verre_id FROM liste_verre_items WHERE commande_verre_id IS NOT NULL
    )
  `, [date]);
  
  let addedCount = 0;
  
  for (const lens of lensesToAdd) {
    await addListeItem({
      liste_id: listeId,
      commande_id: lens.commande_id,
      commande_verre_id: lens.commande_verre_id,
      client_nom: lens.client_nom,
      oeil: lens.oeil,
      type_verre: lens.type_verre,
      indice: lens.indice,
      sphere: lens.sphere,
      cylindre: lens.cylindre,
      axe: lens.axe,
      addition: lens.addition,
      traitements: lens.traitements,
      en_stock: false,
    });
    addedCount++;
  }
  
  return addedCount;
}

// Group similar lenses for display
export function groupLensItems(items: ListeVerreItem[]): GroupedLensItem[] {
  const groups = new Map<string, GroupedLensItem>();
  
  for (const item of items) {
    // Create a key from lens specifications
    const key = [
      item.type_verre || '',
      item.indice?.toString() || '',
      item.sphere?.toString() || '',
      item.cylindre?.toString() || '',
      item.axe?.toString() || '',
      item.addition?.toString() || '',
      item.traitements || ''
    ].join('|');
    
    if (groups.has(key)) {
      const group = groups.get(key)!;
      group.count++;
      group.items.push(item);
      group.allInStock = group.allInStock && item.en_stock;
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
  
  return Array.from(groups.values()).sort((a, b) => {
    // Sort by type, then indice, then sphere
    if (a.type_verre !== b.type_verre) return (a.type_verre || '').localeCompare(b.type_verre || '');
    if (a.indice !== b.indice) return (a.indice || 0) - (b.indice || 0);
    return (a.sphere || 0) - (b.sphere || 0);
  });
}

// Get items to order (not in stock)
export async function getItemsToOrder(listeId: number): Promise<ListeVerreItem[]> {
  return query<ListeVerreItem>(
    'SELECT * FROM liste_verre_items WHERE liste_id = ? AND en_stock = 0 ORDER BY client_nom, oeil',
    [listeId]
  );
}
