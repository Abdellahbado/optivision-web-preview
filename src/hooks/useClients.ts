import { useState, useEffect, useCallback } from 'react';
import * as db from '@/lib/database';
import type { ClientWithStats, ClientInput } from '@/types';

export function useClients(initialSearch?: string, initialFilters?: { hasBalance?: boolean; inactive?: boolean }) {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch || '');
  const [filters, setFilters] = useState(initialFilters || {});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getClients(search || undefined, filters);
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: ClientInput) => {
    const client = await db.createClient(data);
    await refresh();
    return client;
  };

  const update = async (id: number, data: Partial<ClientInput>) => {
    const client = await db.updateClient(id, data);
    await refresh();
    return client;
  };

  const remove = async (id: number) => {
    await db.deleteClient(id);
    await refresh();
  };

  return {
    clients,
    loading,
    error,
    search,
    setSearch,
    filters,
    setFilters,
    refresh,
    create,
    update,
    remove,
  };
}

export function useClient(id: number | null) {
  const [client, setClient] = useState<ClientWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (id === null) {
      setClient(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await db.getClientById(id);
      setClient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { client, loading, error, refresh };
}
