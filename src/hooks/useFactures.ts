import { useState, useEffect, useCallback } from 'react';
import * as db from '@/lib/database';
import type { FactureWithClient, FactureInput, FactureLigneInput, PaiementInput, FactureStatut } from '@/types';

export function useFactures(initialFilters?: {
  search?: string;
  statut?: FactureStatut;
  clientId?: number;
  unpaidOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
}) {
  const [factures, setFactures] = useState<FactureWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters || {});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getFactures(filters);
      setFactures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: FactureInput, lignes: FactureLigneInput[]) => {
    const facture = await db.createFacture(data, lignes);
    await refresh();
    return facture;
  };

  const updateStatus = async (id: number, statut: FactureStatut) => {
    const facture = await db.updateFactureStatus(id, statut);
    await refresh();
    return facture;
  };

  const addPayment = async (data: PaiementInput) => {
    const paiement = await db.addPaiement(data);
    await refresh();
    return paiement;
  };

  return {
    factures,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    create,
    updateStatus,
    addPayment,
  };
}
