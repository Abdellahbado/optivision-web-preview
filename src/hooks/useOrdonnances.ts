import { useState, useEffect, useCallback } from 'react';
import * as db from '@/lib/database';
import type { OrdonnanceWithClient, OrdonnanceInput, Ordonnance } from '@/types';

export function useOrdonnances(clientId?: number) {
  const [ordonnances, setOrdonnances] = useState<OrdonnanceWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getOrdonnances(clientId);
      setOrdonnances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: OrdonnanceInput) => {
    const ordonnance = await db.createOrdonnance(data);
    await refresh();
    return ordonnance;
  };

  const update = async (id: number, data: Partial<OrdonnanceInput>) => {
    const ordonnance = await db.updateOrdonnance(id, data);
    await refresh();
    return ordonnance;
  };

  const remove = async (id: number) => {
    await db.deleteOrdonnance(id);
    await refresh();
  };

  return {
    ordonnances,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  };
}

export function useLatestOrdonnance(clientId: number | null) {
  const [ordonnance, setOrdonnance] = useState<Ordonnance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId === null) {
      setOrdonnance(null);
      return;
    }
    setLoading(true);
    db.getLatestOrdonnance(clientId)
      .then(setOrdonnance)
      .finally(() => setLoading(false));
  }, [clientId]);

  return { ordonnance, loading };
}
