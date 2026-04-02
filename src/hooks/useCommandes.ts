import { useState, useEffect, useCallback } from 'react';
import * as db from '@/lib/database';
import type { CommandeWithClient, CommandeInput, CommandeLigneInput, CommandeStatut } from '@/types';

export function useCommandes(initialFilters?: {
  search?: string;
  statut?: CommandeStatut;
  clientId?: number;
  unpaidOnly?: boolean;
}) {
  const [commandes, setCommandes] = useState<CommandeWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters || {});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getCommandes(filters);
      setCommandes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: CommandeInput, lignes: CommandeLigneInput[]) => {
    const commande = await db.createCommande(data, lignes);
    await refresh();
    return commande;
  };

  const updateStatus = async (id: number, statut: CommandeStatut) => {
    const commande = await db.updateCommandeStatus(id, statut);
    await refresh();
    return commande;
  };

  const updatePayment = async (id: number, montantPaye: number) => {
    const commande = await db.updateCommandePayment(id, montantPaye);
    await refresh();
    return commande;
  };

  return {
    commandes,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    create,
    updateStatus,
    updatePayment,
  };
}

export function useOrderCounts() {
  const [counts, setCounts] = useState<Record<CommandeStatut, number>>({
    NEW: 0, ORD: 0, RCV: 0, ASM: 0, RDY: 0, DLV: 0, CAN: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getOrdersByStatus()
      .then(setCounts)
      .finally(() => setLoading(false));
  }, []);

  return { counts, loading };
}
