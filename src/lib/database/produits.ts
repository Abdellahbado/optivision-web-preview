import { query, execute } from './db';
import type { 
  Produit, 
  ProduitInput, 
  MouvementStock, 
  MouvementType,
  Casse,
  CasseInput,
  Fournisseur, 
  FournisseurInput, 
  CategorieType 
} from '@/types';

export async function getProduits(filters?: { 
  search?: string; 
  categorie?: CategorieType; 
  lowStock?: boolean;
  actif?: boolean;
}): Promise<Produit[]> {
  let sql = 'SELECT * FROM produits WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.search) {
    sql += ' AND (nom LIKE ? OR reference LIKE ? OR marque LIKE ?)';
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (filters?.categorie) {
    sql += ' AND categorie = ?';
    params.push(filters.categorie);
  }

  if (filters?.lowStock) {
    sql += ' AND quantite <= stock_minimum';
  }

  if (filters?.actif !== undefined) {
    sql += ' AND actif = ?';
    params.push(filters.actif ? 1 : 0);
  }

  sql += ' ORDER BY nom';

  const results = await query<Produit & { category_data?: string }>(sql, params);
  
  // Parse JSON category data
  return results.map(row => {
    const categoryData = row.category_data ? JSON.parse(row.category_data) : {};
    const { category_data: _, ...rest } = row;
    return {
      ...rest,
      monture: categoryData.monture,
      verre: categoryData.verre,
      lentille: categoryData.lentille,
      accessoire: categoryData.accessoire,
      service: categoryData.service,
    };
  });
}

export async function getProduitById(id: number): Promise<Produit | null> {
  const results = await query<Produit & { category_data?: string }>('SELECT * FROM produits WHERE id = ?', [id]);
  if (!results[0]) return null;
  
  const row = results[0];
  const categoryData = row.category_data ? JSON.parse(row.category_data) : {};
  const { category_data: _, ...rest } = row;
  return {
    ...rest,
    monture: categoryData.monture,
    verre: categoryData.verre,
    lentille: categoryData.lentille,
    accessoire: categoryData.accessoire,
    service: categoryData.service,
  };
}

export async function createProduit(data: ProduitInput): Promise<Produit> {
  // Serialize category-specific data as JSON
  const categoryData = JSON.stringify({
    monture: data.monture,
    verre: data.verre,
    lentille: data.lentille,
    accessoire: data.accessoire,
    service: data.service,
  });

  const result = await execute(`
    INSERT INTO produits (
      reference, nom, categorie, marque, modele, couleur, taille, matiere,
      prix_achat, prix_vente, quantite, stock_minimum, fournisseur_id, emplacement,
      category_data, notes, actif
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.reference, data.nom, data.categorie, data.marque || null, data.modele || null,
    data.couleur || null, data.taille || null, data.matiere || null,
    data.prix_achat ?? null, data.prix_vente, data.quantite, data.stock_minimum,
    data.fournisseur_id ?? null, data.emplacement || null,
    categoryData, data.notes || null, data.actif !== false ? 1 : 0
  ]);
  
  return (await getProduitById(result.lastInsertId as number))!;
}

export async function updateProduit(id: number, data: Partial<ProduitInput>): Promise<Produit> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.reference !== undefined) { fields.push('reference = ?'); values.push(data.reference); }
  if (data.nom !== undefined) { fields.push('nom = ?'); values.push(data.nom); }
  if (data.categorie !== undefined) { fields.push('categorie = ?'); values.push(data.categorie); }
  if (data.marque !== undefined) { fields.push('marque = ?'); values.push(data.marque || null); }
  if (data.modele !== undefined) { fields.push('modele = ?'); values.push(data.modele || null); }
  if (data.couleur !== undefined) { fields.push('couleur = ?'); values.push(data.couleur || null); }
  if (data.taille !== undefined) { fields.push('taille = ?'); values.push(data.taille || null); }
  if (data.matiere !== undefined) { fields.push('matiere = ?'); values.push(data.matiere || null); }
  if (data.prix_achat !== undefined) { fields.push('prix_achat = ?'); values.push(data.prix_achat ?? null); }
  if (data.prix_vente !== undefined) { fields.push('prix_vente = ?'); values.push(data.prix_vente); }
  if (data.stock_minimum !== undefined) { fields.push('stock_minimum = ?'); values.push(data.stock_minimum); }
  if (data.fournisseur_id !== undefined) { fields.push('fournisseur_id = ?'); values.push(data.fournisseur_id ?? null); }
  if (data.emplacement !== undefined) { fields.push('emplacement = ?'); values.push(data.emplacement || null); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes || null); }
  if (data.actif !== undefined) { fields.push('actif = ?'); values.push(data.actif ? 1 : 0); }
  
  // Update category-specific data if any is provided
  if (data.monture !== undefined || data.verre !== undefined || data.lentille !== undefined || 
      data.accessoire !== undefined || data.service !== undefined) {
    const categoryData = JSON.stringify({
      monture: data.monture,
      verre: data.verre,
      lentille: data.lentille,
      accessoire: data.accessoire,
      service: data.service,
    });
    fields.push('category_data = ?');
    values.push(categoryData);
  }

  values.push(id);

  await execute(`UPDATE produits SET ${fields.join(', ')} WHERE id = ?`, values);
  
  return (await getProduitById(id))!;
}

export async function adjustStock(
  produitId: number, 
  quantite: number, 
  type: MouvementType,
  raison?: string,
  commandeId?: number
): Promise<{ produit: Produit; mouvement: MouvementStock }> {
  const produit = await getProduitById(produitId);
  if (!produit) throw new Error('Produit non trouvé');

  const quantiteAvant = produit.quantite;
  let quantiteApres: number;

  if (type === 'ENTREE' || type === 'ANNULATION') {
    quantiteApres = quantiteAvant + quantite;
  } else if (type === 'SORTIE' || type === 'VENTE' || type === 'CASSE') {
    quantiteApres = quantiteAvant - quantite;
    if (quantiteApres < 0) {
      throw new Error(`Stock insuffisant. Disponible: ${quantiteAvant}, Demandé: ${quantite}`);
    }
  } else {
    quantiteApres = quantite; // AJUSTEMENT sets absolute value
  }

  // Record movement with purchase price for loss tracking
  const result = await execute(`
    INSERT INTO mouvements_stock (produit_id, type, quantite, quantite_avant, quantite_apres, raison, commande_id, prix_achat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [produitId, type, quantite, quantiteAvant, quantiteApres, raison || null, commandeId || null, produit.prix_achat || null]);

  // Update product quantity
  await execute('UPDATE produits SET quantite = ? WHERE id = ?', [quantiteApres, produitId]);

  const mouvementId = result.lastInsertId;
  const mouvement = (await query<MouvementStock>('SELECT * FROM mouvements_stock WHERE id = ?', [mouvementId]))[0];
  
  return { 
    produit: (await getProduitById(produitId))!, 
    mouvement 
  };
}

// Record breakage (casse) - combines stock movement + loss record
export async function recordCasse(input: CasseInput): Promise<{ casse: Casse; produit: Produit }> {
  const produit = await getProduitById(input.produit_id);
  if (!produit) throw new Error('Produit non trouvé');

  const prixAchat = produit.prix_achat || 0;
  const montantPerte = input.quantite * prixAchat;

  // Create stock movement
  const { mouvement, produit: updatedProduit } = await adjustStock(
    input.produit_id,
    input.quantite,
    'CASSE',
    `${input.raison}: ${input.notes || 'Aucune note'}`
  );

  // Create casse record for detailed loss tracking
  const result = await execute(`
    INSERT INTO casses (produit_id, mouvement_id, quantite, prix_achat_unitaire, montant_perte, raison, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [input.produit_id, mouvement.id, input.quantite, prixAchat, montantPerte, input.raison, input.notes || null]);

  const casseId = result.lastInsertId;
  const casse = (await query<Casse>('SELECT * FROM casses WHERE id = ?', [casseId]))[0];

  return { casse, produit: updatedProduit };
}

// Get all breakage records
export async function getCasses(filters?: { 
  produitId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<(Casse & { produit_nom?: string; produit_reference?: string })[]> {
  let sql = `
    SELECT c.*, p.nom as produit_nom, p.reference as produit_reference 
    FROM casses c
    LEFT JOIN produits p ON c.produit_id = p.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (filters?.produitId) {
    sql += ' AND c.produit_id = ?';
    params.push(filters.produitId);
  }

  if (filters?.dateFrom) {
    sql += ' AND date(c.date) >= date(?)';
    params.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    sql += ' AND date(c.date) <= date(?)';
    params.push(filters.dateTo);
  }

  sql += ' ORDER BY c.date DESC';

  return query(sql, params);
}

// Get total losses summary
export async function getLossSummary(dateFrom?: string, dateTo?: string): Promise<{
  totalQuantite: number;
  totalMontant: number;
  parCategorie: { categorie: CategorieType; quantite: number; montant: number }[];
}> {
  let sql = `
    SELECT 
      SUM(c.quantite) as total_quantite,
      SUM(c.montant_perte) as total_montant
    FROM casses c
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (dateFrom) {
    sql += ' AND date(c.date) >= date(?)';
    params.push(dateFrom);
  }

  if (dateTo) {
    sql += ' AND date(c.date) <= date(?)';
    params.push(dateTo);
  }

  const totalResult = await query<{ total_quantite: number; total_montant: number }>(sql, params);

  // Get breakdown by category
  let categorySql = `
    SELECT 
      p.categorie,
      SUM(c.quantite) as quantite,
      SUM(c.montant_perte) as montant
    FROM casses c
    JOIN produits p ON c.produit_id = p.id
    WHERE 1=1
  `;
  const categoryParams: unknown[] = [];

  if (dateFrom) {
    categorySql += ' AND date(c.date) >= date(?)';
    categoryParams.push(dateFrom);
  }

  if (dateTo) {
    categorySql += ' AND date(c.date) <= date(?)';
    categoryParams.push(dateTo);
  }

  categorySql += ' GROUP BY p.categorie';

  const categoryResult = await query<{ categorie: CategorieType; quantite: number; montant: number }>(categorySql, categoryParams);

  return {
    totalQuantite: totalResult[0]?.total_quantite || 0,
    totalMontant: totalResult[0]?.total_montant || 0,
    parCategorie: categoryResult,
  };
}

export async function getStockMovements(produitId: number): Promise<MouvementStock[]> {
  return query<MouvementStock>(
    'SELECT * FROM mouvements_stock WHERE produit_id = ? ORDER BY date DESC',
    [produitId]
  );
}

export async function getLowStockProducts(): Promise<Produit[]> {
  return query<Produit>(
    'SELECT * FROM produits WHERE quantite <= stock_minimum AND actif = 1 ORDER BY quantite ASC'
  );
}

// Fournisseurs
export async function getFournisseurs(): Promise<Fournisseur[]> {
  return query<Fournisseur>('SELECT * FROM fournisseurs ORDER BY nom');
}

export async function createFournisseur(data: FournisseurInput): Promise<Fournisseur> {
  const result = await execute(`
    INSERT INTO fournisseurs (nom, contact, telephone, email, adresse, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [data.nom, data.contact || null, data.telephone || null, data.email || null, data.adresse || null, data.notes || null]);
  
  const created = await query<Fournisseur>('SELECT * FROM fournisseurs WHERE id = ?', [result.lastInsertId]);
  return created[0];
}
