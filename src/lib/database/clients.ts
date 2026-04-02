import { query, execute } from './db';
import type { Client, ClientWithStats, ClientInput } from '@/types';

async function generateClientCode(): Promise<string> {
  const result = await query<{ max_id: number }>('SELECT COALESCE(MAX(id), 0) + 1 as max_id FROM clients');
  const nextId = result[0]?.max_id || 1;
  return `CLI-${nextId.toString().padStart(4, '0')}`;
}

export async function getClients(search?: string, filters?: { hasBalance?: boolean; inactive?: boolean }): Promise<ClientWithStats[]> {
  let sql = `
    SELECT 
      c.*,
      (SELECT MAX(date_commande) FROM commandes WHERE client_id = c.id) as derniere_visite,
      COALESCE((SELECT SUM(montant_total) FROM commandes WHERE client_id = c.id), 0) as total_achats,
      COALESCE(
        (SELECT SUM(montant_total - montant_paye) FROM commandes WHERE client_id = c.id AND montant_paye < montant_total), 
        0
      ) as solde,
      (SELECT COUNT(*) FROM commandes WHERE client_id = c.id) as nombre_commandes
    FROM clients c
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (search) {
    sql += ` AND (c.nom LIKE ? OR c.prenom LIKE ? OR c.telephone LIKE ? OR c.code LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (filters?.hasBalance) {
    sql += ` AND (SELECT SUM(montant_total - montant_paye) FROM commandes WHERE client_id = c.id AND montant_paye < montant_total) > 0`;
  }

  if (filters?.inactive) {
    sql += ` AND (
      (SELECT MAX(date_commande) FROM commandes WHERE client_id = c.id) IS NULL 
      OR (SELECT MAX(date_commande) FROM commandes WHERE client_id = c.id) < date('now', '-1 year')
    )`;
  }

  sql += ` ORDER BY c.date_modification DESC`;

  return query<ClientWithStats>(sql, params);
}

export async function getClientById(id: number): Promise<ClientWithStats | null> {
  const results = await query<ClientWithStats>(`
    SELECT 
      c.*,
      (SELECT MAX(date_commande) FROM commandes WHERE client_id = c.id) as derniere_visite,
      COALESCE((SELECT SUM(montant_total) FROM commandes WHERE client_id = c.id), 0) as total_achats,
      COALESCE(
        (SELECT SUM(montant_total - montant_paye) FROM commandes WHERE client_id = c.id AND montant_paye < montant_total), 
        0
      ) as solde,
      (SELECT COUNT(*) FROM commandes WHERE client_id = c.id) as nombre_commandes
    FROM clients c
    WHERE c.id = ?
  `, [id]);
  return results[0] || null;
}

export async function createClient(data: ClientInput): Promise<Client> {
  const code = await generateClientCode();
  const result = await execute(`
    INSERT INTO clients (code, prenom, nom, telephone, telephone2, email, adresse, ville, date_naissance, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [code, data.prenom, data.nom, data.telephone, data.telephone2 || null, data.email || null, 
      data.adresse || null, data.ville || null, data.date_naissance || null, data.notes || null]);
  
  const created = await query<Client>('SELECT * FROM clients WHERE id = ?', [result.lastInsertId]);
  return created[0];
}

export async function updateClient(id: number, data: Partial<ClientInput>): Promise<Client> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.prenom !== undefined) { fields.push('prenom = ?'); values.push(data.prenom); }
  if (data.nom !== undefined) { fields.push('nom = ?'); values.push(data.nom); }
  if (data.telephone !== undefined) { fields.push('telephone = ?'); values.push(data.telephone); }
  if (data.telephone2 !== undefined) { fields.push('telephone2 = ?'); values.push(data.telephone2 || null); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email || null); }
  if (data.adresse !== undefined) { fields.push('adresse = ?'); values.push(data.adresse || null); }
  if (data.ville !== undefined) { fields.push('ville = ?'); values.push(data.ville || null); }
  if (data.date_naissance !== undefined) { fields.push('date_naissance = ?'); values.push(data.date_naissance || null); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes || null); }

  fields.push("date_modification = datetime('now')");
  values.push(id);

  await execute(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values);
  
  const updated = await query<Client>('SELECT * FROM clients WHERE id = ?', [id]);
  return updated[0];
}

export async function deleteClient(id: number): Promise<void> {
  await execute('DELETE FROM clients WHERE id = ?', [id]);
}

export async function checkPhoneDuplicate(phone: string, excludeId?: number): Promise<boolean> {
  let sql = 'SELECT COUNT(*) as count FROM clients WHERE telephone = ?';
  const params: unknown[] = [phone];
  
  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }
  
  const result = await query<{ count: number }>(sql, params);
  return result[0].count > 0;
}
