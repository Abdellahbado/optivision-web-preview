import { useState, useEffect, useCallback } from 'react';
import * as db from '@/lib/database';

interface DashboardStats {
  todaySales: number;
  monthSales: number;
  pendingOrders: number;
  lowStockCount: number;
  readyOrders: number;
}

interface RecentClient {
  id: number;
  code: string;
  nom: string;
  prenom: string;
  telephone: string;
  date_creation: string;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, clientsData] = await Promise.all([
        db.getDashboardStats(),
        db.getRecentClients(5),
      ]);
      setStats(statsData);
      setRecentClients(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    recentClients,
    loading,
    error,
    refresh,
  };
}
