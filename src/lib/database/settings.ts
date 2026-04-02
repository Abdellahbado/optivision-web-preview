import { query, execute } from './db';

export interface Settings {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  currency: string;
  tva_rate: string;
  last_backup: string;
  [key: string]: string;
}

export async function getSettings(): Promise<Settings> {
  const results = await query<{ cle: string; valeur: string }>('SELECT * FROM parametres');
  
  const settings: Settings = {
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    shop_email: '',
    currency: 'DZD',
    tva_rate: '0',
    last_backup: '',
  };
  
  for (const row of results) {
    settings[row.cle] = row.valeur || '';
  }
  
  return settings;
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await execute(
    'INSERT OR REPLACE INTO parametres (cle, valeur) VALUES (?, ?)',
    [key, value]
  );
}

export async function updateSettings(settings: Partial<Settings>): Promise<void> {
  for (const [key, value] of Object.entries(settings)) {
    if (value !== undefined) {
      await updateSetting(key, value);
    }
  }
}

export async function getDashboardStats(): Promise<{
  todaySales: number;
  monthSales: number;
  pendingOrders: number;
  lowStockCount: number;
  readyOrders: number;
}> {
  const [todaySales] = await query<{ total: number }>(
    "SELECT COALESCE(SUM(montant_ttc), 0) as total FROM factures WHERE date(date_facture) = date('now') AND statut != 'ANNULEE'"
  );
  
  const [monthSales] = await query<{ total: number }>(
    "SELECT COALESCE(SUM(montant_ttc), 0) as total FROM factures WHERE strftime('%Y-%m', date_facture) = strftime('%Y-%m', 'now') AND statut != 'ANNULEE'"
  );
  
  const [pendingOrders] = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM commandes WHERE statut NOT IN ('DLV', 'CAN')"
  );
  
  const [lowStockCount] = await query<{ count: number }>(
    'SELECT COUNT(*) as count FROM produits WHERE quantite <= stock_minimum AND actif = 1'
  );
  
  const [readyOrders] = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM commandes WHERE statut = 'RDY'"
  );
  
  return {
    todaySales: todaySales?.total || 0,
    monthSales: monthSales?.total || 0,
    pendingOrders: pendingOrders?.count || 0,
    lowStockCount: lowStockCount?.count || 0,
    readyOrders: readyOrders?.count || 0,
  };
}

export async function getRecentClients(limit: number = 5): Promise<{ id: number; code: string; nom: string; prenom: string; telephone: string; date_creation: string }[]> {
  return query(`
    SELECT id, code, nom, prenom, telephone, date_creation 
    FROM clients 
    ORDER BY date_creation DESC 
    LIMIT ?
  `, [limit]);
}
