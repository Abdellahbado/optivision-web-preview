import { useMemo, useState } from 'react';
import { Tabs } from '@/components/layout/Tabs';
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import { useAppDataStore } from '@/stores/appDataStore';
import { ProduitsPage } from './ProduitsPage';
import { RechercheStockPage } from './RechercheStockPage';

const MOUVEMENT_LABELS: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'default' }> = {
  ENTREE: { label: 'Entrée', variant: 'success' },
  SORTIE: { label: 'Sortie', variant: 'warning' },
  VENTE: { label: 'Vente', variant: 'info' },
  CASSE: { label: 'Casse', variant: 'danger' },
  AJUSTEMENT: { label: 'Ajustement', variant: 'default' },
  ANNULATION: { label: 'Retour (annulation)', variant: 'default' },
};

function MouvementsPanel() {
  const mouvements = useAppDataStore((state) => state.mouvements);
  const produits = useAppDataStore((state) => state.produits);

  const lignes = useMemo(
    () =>
      mouvements.slice(0, 200).map((mouvement) => ({
        ...mouvement,
        produit: produits.find((item) => item.id === mouvement.produit_id),
      })),
    [mouvements, produits]
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Mouvements de stock</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Chaque entrée, vente, sortie et annulation laisse une trace.
        </p>
      </div>

      <Card>
        {lignes.length === 0 ? (
          <p className="p-6 text-sm text-text-muted text-center">
            Aucun mouvement pour l’instant. Les ventes et les entrées de stock apparaîtront ici.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Stock après</TableHead>
                <TableHead>Motif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignes.map((mouvement) => {
                const config = MOUVEMENT_LABELS[mouvement.type] ?? {
                  label: mouvement.type,
                  variant: 'default' as const,
                };
                const signe = ['ENTREE', 'ANNULATION'].includes(mouvement.type) ? '+' : '−';
                return (
                  <TableRow key={mouvement.id}>
                    <TableCell className="text-text-secondary">
                      {formatDateTime(mouvement.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {mouvement.produit?.nom ?? `Produit #${mouvement.produit_id}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {signe}
                      {mouvement.quantite}
                    </TableCell>
                    <TableCell className="text-right">{mouvement.quantite_apres}</TableCell>
                    <TableCell className="text-text-secondary text-sm">
                      {mouvement.raison ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

/** Stock: le catalogue, la recherche de verres et l'historique, au meme endroit. */
export function StockPage() {
  const [onglet, setOnglet] = useState('produits');
  const produits = useAppDataStore((state) => state.produits);
  const stockBas = produits.filter(
    (produit) => produit.actif && produit.quantite <= produit.stock_minimum
  ).length;

  return (
    <div className="space-y-5">
      <Tabs
        tabs={[
          { id: 'produits', label: 'Produits', badge: stockBas },
          { id: 'recherche', label: 'Chercher un verre' },
          { id: 'mouvements', label: 'Mouvements' },
        ]}
        active={onglet}
        onChange={setOnglet}
      />
      {onglet === 'produits' && <ProduitsPage />}
      {onglet === 'recherche' && <RechercheStockPage />}
      {onglet === 'mouvements' && <MouvementsPanel />}
    </div>
  );
}
