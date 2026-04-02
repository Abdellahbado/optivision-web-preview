import { query, execute } from './db';
import type { Ordonnance, OrdonnanceWithClient, OrdonnanceInput } from '@/types';

export async function getOrdonnances(clientId?: number): Promise<OrdonnanceWithClient[]> {
  let sql = `
    SELECT o.*, c.nom as client_nom, c.prenom as client_prenom
    FROM ordonnances o
    JOIN clients c ON o.client_id = c.id
  `;
  const params: unknown[] = [];

  if (clientId) {
    sql += ' WHERE o.client_id = ?';
    params.push(clientId);
  }

  sql += ' ORDER BY o.date_prescription DESC';

  return query<OrdonnanceWithClient>(sql, params);
}

export async function getOrdonnanceById(id: number): Promise<OrdonnanceWithClient | null> {
  const results = await query<OrdonnanceWithClient>(`
    SELECT o.*, c.nom as client_nom, c.prenom as client_prenom
    FROM ordonnances o
    JOIN clients c ON o.client_id = c.id
    WHERE o.id = ?
  `, [id]);
  return results[0] || null;
}

export async function getLatestOrdonnance(clientId: number): Promise<Ordonnance | null> {
  const results = await query<Ordonnance>(`
    SELECT * FROM ordonnances 
    WHERE client_id = ? 
    ORDER BY date_prescription DESC 
    LIMIT 1
  `, [clientId]);
  return results[0] || null;
}

export async function createOrdonnance(data: OrdonnanceInput): Promise<Ordonnance> {
  const result = await execute(`
    INSERT INTO ordonnances (
      client_id, date_prescription, medecin,
      od_sphere, od_cylindre, od_axe, od_addition,
      og_sphere, og_cylindre, og_axe, og_addition,
      ecart_pupillaire, ecart_vl, ecart_vp, type_vision, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.client_id, data.date_prescription, data.medecin || null,
    data.od_sphere ?? null, data.od_cylindre ?? null, data.od_axe ?? null, data.od_addition ?? null,
    data.og_sphere ?? null, data.og_cylindre ?? null, data.og_axe ?? null, data.og_addition ?? null,
    data.ecart_pupillaire ?? null, data.ecart_vl ?? null, data.ecart_vp ?? null, 
    data.type_vision || null, data.notes || null
  ]);
  
  const created = await query<Ordonnance>('SELECT * FROM ordonnances WHERE id = ?', [result.lastInsertId]);
  return created[0];
}

export async function updateOrdonnance(id: number, data: Partial<OrdonnanceInput>): Promise<Ordonnance> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.date_prescription !== undefined) { fields.push('date_prescription = ?'); values.push(data.date_prescription); }
  if (data.medecin !== undefined) { fields.push('medecin = ?'); values.push(data.medecin || null); }
  if (data.od_sphere !== undefined) { fields.push('od_sphere = ?'); values.push(data.od_sphere ?? null); }
  if (data.od_cylindre !== undefined) { fields.push('od_cylindre = ?'); values.push(data.od_cylindre ?? null); }
  if (data.od_axe !== undefined) { fields.push('od_axe = ?'); values.push(data.od_axe ?? null); }
  if (data.od_addition !== undefined) { fields.push('od_addition = ?'); values.push(data.od_addition ?? null); }
  if (data.og_sphere !== undefined) { fields.push('og_sphere = ?'); values.push(data.og_sphere ?? null); }
  if (data.og_cylindre !== undefined) { fields.push('og_cylindre = ?'); values.push(data.og_cylindre ?? null); }
  if (data.og_axe !== undefined) { fields.push('og_axe = ?'); values.push(data.og_axe ?? null); }
  if (data.og_addition !== undefined) { fields.push('og_addition = ?'); values.push(data.og_addition ?? null); }
  if (data.ecart_pupillaire !== undefined) { fields.push('ecart_pupillaire = ?'); values.push(data.ecart_pupillaire ?? null); }
  if (data.ecart_vl !== undefined) { fields.push('ecart_vl = ?'); values.push(data.ecart_vl ?? null); }
  if (data.ecart_vp !== undefined) { fields.push('ecart_vp = ?'); values.push(data.ecart_vp ?? null); }
  if (data.type_vision !== undefined) { fields.push('type_vision = ?'); values.push(data.type_vision || null); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes || null); }

  values.push(id);

  await execute(`UPDATE ordonnances SET ${fields.join(', ')} WHERE id = ?`, values);
  
  const updated = await query<Ordonnance>('SELECT * FROM ordonnances WHERE id = ?', [id]);
  return updated[0];
}

export async function deleteOrdonnance(id: number): Promise<void> {
  await execute('DELETE FROM ordonnances WHERE id = ?', [id]);
}
