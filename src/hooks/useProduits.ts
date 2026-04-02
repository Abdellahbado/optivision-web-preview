import { useState, useEffect, useCallback } from 'react';
import * as db from '@/lib/database';
import type { Produit, ProduitInput, CategorieType } from '@/types';

export function useProduits(initialFilters?: { 
  search?: string; 
  categorie?: CategorieType; 
  lowStock?: boolean;
}) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters || {});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getProduits({ ...filters, actif: true });
      setProduits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (data: ProduitInput) => {
    const produit = await db.createProduit(data);
    await refresh();
    return produit;
  };

  const update = async (id: number, data: Partial<ProduitInput>) => {
    const produit = await db.updateProduit(id, data);
    await refresh();
    return produit;
  };

  const adjustStock = async (
    produitId: number, 
    quantite: number, 
    type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT',
    raison?: string
  ) => {
    const produit = await db.adjustStock(produitId, quantite, type, raison);
    await refresh();
    return produit;
  };

  return {
    produits,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    create,
    update,
    adjustStock,
  };
}

export function useLowStockProducts() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getLowStockProducts()
      .then(setProduits)
      .finally(() => setLoading(false));
  }, []);

  return { produits, loading };
}
