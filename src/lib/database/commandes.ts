import { query, execute } from './db';
import type { 
  Commande, CommandeWithClient, CommandeInput, 
  CommandeLigne, CommandeLigneInput, CommandeStatut 
} from '@/types';

async function generateOrderCode(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM commandes WHERE numero LIKE ?",
    [`CMD-${year}-%`]
  );
  const nextNum = (result[0]?.count || 0) + 1;
  return `CMD-${year}-${nextNum.toString().padStart(4, '0')}`;
}

export async function getCommandes(filters?: {
  search?: string;
  statut?: CommandeStatut;
  clientId?: number;
  unpaidOnly?: boolean;
}): Promise<CommandeWithClient[]> {
  let sql = `
    SELECT c.*, cl.nom as client_nom, cl.prenom as client_prenom, cl.telephone as client_telephone
    FROM commandes c
    JOIN clients cl ON c.client_id = cl.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.search) {
    sql += ` AND (c.numero LIKE ? OR cl.nom LIKE ? OR cl.prenom LIKE ? OR cl.telephone LIKE ?)`;
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (filters?.statut) {
    sql += ' AND c.statut = ?';
    params.push(filters.statut);
  }

  if (filters?.clientId) {
    sql += ' AND c.client_id = ?';
    params.push(filters.clientId);
  }

  if (filters?.unpaidOnly) {
    sql += ' AND c.montant_paye < c.total_ttc';
  }

  sql += ' ORDER BY c.date_commande DESC';

  return query<CommandeWithClient>(sql, params);
}

export async function getCommandeById(id: number): Promise<CommandeWithClient | null> {
  const results = await query<CommandeWithClient>(`
    SELECT c.*, cl.nom as client_nom, cl.prenom as client_prenom, cl.telephone as client_telephone
    FROM commandes c
    JOIN clients cl ON c.client_id = cl.id
    WHERE c.id = ?
  `, [id]);
  return results[0] || null;
}

export async function getCommandeLignes(commandeId: number): Promise<CommandeLigne[]> {
  return query<CommandeLigne>(
    'SELECT * FROM commande_lignes WHERE commande_id = ?',
    [commandeId]
  );
}

export async function createCommande(data: CommandeInput, lignes: CommandeLigneInput[]): Promise<Commande> {
  const numero = await generateOrderCode();
  
  const result = await execute(`
    INSERT INTO commandes (
      numero, client_id, ordonnance_id, date_commande, date_livraison_prevue,
      statut, total_ht, remise_pourcentage, remise_montant, total_ttc, notes, notes_atelier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    numero, data.client_id, data.ordonnance_id ?? null, data.date_commande,
    data.date_livraison_prevue || null, data.statut || 'NEW',
    data.total_ht, data.remise_pourcentage || null, data.remise_montant || null, 
    data.total_ttc, data.notes || null, data.notes_atelier || null
  ]);
  
  const commandeId = result.lastInsertId;

  // Insert lines
  for (const ligne of lignes) {
    await execute(`
      INSERT INTO commande_lignes (
        commande_id, produit_id, description, type, quantite, prix_unitaire, remise, prix_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      commandeId, ligne.produit_id ?? null, ligne.description, ligne.type,
      ligne.quantite, ligne.prix_unitaire, ligne.remise || 0, ligne.prix_total
    ]);
  }
  
  const created = await query<Commande>('SELECT * FROM commandes WHERE id = ?', [commandeId]);
  return created[0];
}

export async function updateCommandeStatus(id: number, statut: CommandeStatut): Promise<Commande> {
  let updateSql = "UPDATE commandes SET statut = ?, updated_at = datetime('now')";
  const params: unknown[] = [statut];

  if (statut === 'DLV') {
    updateSql += ", date_livraison = datetime('now')";
  }

  updateSql += ' WHERE id = ?';
  params.push(id);

  await execute(updateSql, params);
  
  const updated = await query<Commande>('SELECT * FROM commandes WHERE id = ?', [id]);
  return updated[0];
}

export async function updateCommandePayment(id: number, montantPaye: number): Promise<Commande> {
  await execute(
    "UPDATE commandes SET montant_paye = ?, updated_at = datetime('now') WHERE id = ?",
    [montantPaye, id]
  );
  
  const updated = await query<Commande>('SELECT * FROM commandes WHERE id = ?', [id]);
  return updated[0];
}

export async function getOrdersByStatus(): Promise<Record<CommandeStatut, number>> {
  const results = await query<{ statut: CommandeStatut; count: number }>(
    'SELECT statut, COUNT(*) as count FROM commandes GROUP BY statut'
  );
  
  const counts: Record<CommandeStatut, number> = {
    NEW: 0, ORD: 0, RCV: 0, ASM: 0, RDY: 0, DLV: 0, CAN: 0
  };
  
  for (const row of results) {
    counts[row.statut] = row.count;
  }
  
  return counts;
}

export async function getPendingOrdersCount(): Promise<number> {
  const result = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM commandes WHERE statut NOT IN ('DLV', 'CAN')"
  );
  return result[0]?.count || 0;
}

export async function getReadyOrders(): Promise<CommandeWithClient[]> {
  return query<CommandeWithClient>(`
    SELECT c.*, cl.nom as client_nom, cl.prenom as client_prenom, cl.telephone as client_telephone
    FROM commandes c
    JOIN clients cl ON c.client_id = cl.id
    WHERE c.statut = 'RDY'
    ORDER BY c.date_commande ASC
  `);
}
