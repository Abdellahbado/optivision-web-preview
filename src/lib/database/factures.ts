import { query, execute } from './db';
import type { 
  Facture, FactureWithClient, FactureInput, 
  FactureLigne, FactureLigneInput, Paiement, PaiementInput, FactureStatut 
} from '@/types';

async function generateInvoiceCode(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM factures WHERE numero LIKE ?",
    [`FAC-${year}-%`]
  );
  const nextNum = (result[0]?.count || 0) + 1;
  return `FAC-${year}-${nextNum.toString().padStart(4, '0')}`;
}

export async function getFactures(filters?: {
  search?: string;
  statut?: FactureStatut;
  clientId?: number;
  unpaidOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): Promise<FactureWithClient[]> {
  let sql = `
    SELECT f.*, cl.nom as client_nom, cl.prenom as client_prenom
    FROM factures f
    JOIN clients cl ON f.client_id = cl.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.search) {
    sql += ` AND (f.numero LIKE ? OR cl.nom LIKE ? OR cl.prenom LIKE ?)`;
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (filters?.statut) {
    sql += ' AND f.statut = ?';
    params.push(filters.statut);
  }

  if (filters?.clientId) {
    sql += ' AND f.client_id = ?';
    params.push(filters.clientId);
  }

  if (filters?.unpaidOnly) {
    sql += ' AND f.montant_paye < f.total_ttc';
  }

  if (filters?.dateFrom) {
    sql += ' AND f.date_facture >= ?';
    params.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    sql += ' AND f.date_facture <= ?';
    params.push(filters.dateTo);
  }

  sql += ' ORDER BY f.date_facture DESC';

  return query<FactureWithClient>(sql, params);
}

export async function getFactureById(id: number): Promise<FactureWithClient | null> {
  const results = await query<FactureWithClient>(`
    SELECT f.*, cl.nom as client_nom, cl.prenom as client_prenom
    FROM factures f
    JOIN clients cl ON f.client_id = cl.id
    WHERE f.id = ?
  `, [id]);
  return results[0] || null;
}

export async function getFactureLignes(factureId: number): Promise<FactureLigne[]> {
  return query<FactureLigne>(
    'SELECT * FROM facture_lignes WHERE facture_id = ?',
    [factureId]
  );
}

export async function getFacturePaiements(factureId: number): Promise<Paiement[]> {
  return query<Paiement>(
    'SELECT * FROM paiements WHERE facture_id = ? ORDER BY date DESC',
    [factureId]
  );
}

export async function createFacture(data: FactureInput, lignes: FactureLigneInput[]): Promise<Facture> {
  const numero = await generateInvoiceCode();
  
  const result = await execute(`
    INSERT INTO factures (
      numero, commande_id, client_id, date_facture, date_echeance, total_ht, tva, 
      remise_montant, total_ttc, montant_paye, mode_paiement, notes, statut
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    numero, data.commande_id ?? null, data.client_id, data.date_facture, data.date_echeance || null,
    data.total_ht, data.tva || 0, data.remise_montant || 0, data.total_ttc,
    data.montant_paye || 0, data.mode_paiement || null, data.notes || null,
    data.statut || 'DRAFT'
  ]);
  
  const factureId = result.lastInsertId;

  // Insert lines
  for (const ligne of lignes) {
    await execute(`
      INSERT INTO facture_lignes (facture_id, description, quantite, prix_unitaire, remise, prix_total)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [factureId, ligne.description, ligne.quantite, ligne.prix_unitaire, ligne.remise || 0, ligne.prix_total]);
  }
  
  const created = await query<Facture>('SELECT * FROM factures WHERE id = ?', [factureId]);
  return created[0];
}

export async function updateFactureStatus(id: number, statut: FactureStatut): Promise<Facture> {
  await execute('UPDATE factures SET statut = ? WHERE id = ?', [statut, id]);
  const updated = await query<Facture>('SELECT * FROM factures WHERE id = ?', [id]);
  return updated[0];
}

export async function addPaiement(data: PaiementInput): Promise<Paiement> {
  const result = await execute(`
    INSERT INTO paiements (facture_id, date, montant, mode, reference, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [data.facture_id, data.date, data.montant, data.mode, data.reference || null, data.notes || null]);

  // Update facture total paid
  await execute(`
    UPDATE factures SET montant_paye = (
      SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE facture_id = ?
    ) WHERE id = ?
  `, [data.facture_id, data.facture_id]);

  // Check if fully paid
  const facture = await getFactureById(data.facture_id);
  if (facture && facture.montant_paye >= facture.total_ttc && facture.statut !== 'CANCELLED') {
    await updateFactureStatus(data.facture_id, 'PAID');
  }
  
  const created = await query<Paiement>('SELECT * FROM paiements WHERE id = ?', [result.lastInsertId]);
  return created[0];
}

export async function getTodaySales(): Promise<number> {
  const result = await query<{ total: number }>(
    "SELECT COALESCE(SUM(total_ttc), 0) as total FROM factures WHERE date(date_facture) = date('now') AND statut != 'CANCELLED'"
  );
  return result[0]?.total || 0;
}

export async function getMonthSales(): Promise<number> {
  const result = await query<{ total: number }>(
    "SELECT COALESCE(SUM(total_ttc), 0) as total FROM factures WHERE strftime('%Y-%m', date_facture) = strftime('%Y-%m', 'now') AND statut != 'CANCELLED'"
  );
  return result[0]?.total || 0;
}

export async function getUnpaidInvoices(): Promise<FactureWithClient[]> {
  return query<FactureWithClient>(`
    SELECT f.*, cl.nom as client_nom, cl.prenom as client_prenom
    FROM factures f
    JOIN clients cl ON f.client_id = cl.id
    WHERE f.montant_paye < f.total_ttc AND f.statut NOT IN ('CANCELLED', 'DRAFT')
    ORDER BY f.date_facture ASC
  `);
}
