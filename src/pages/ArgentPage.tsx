import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { Tabs } from '@/components/layout/Tabs';
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { MODE_PAIEMENT } from '@/lib/labels';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppDataStore } from '@/stores/appDataStore';
import { FacturesPage } from './FacturesPage';
import type { PaymentMethod } from '@/types';

/** Caisse du jour: ce qui est reellement entre aujourd'hui, par mode de paiement. */
function CaisseDuJour() {
  const paiements = useAppDataStore((state) => state.paiements);
  const factures = useAppDataStore((state) => state.factures);
  const clients = useAppDataStore((state) => state.clients);
  const [jour, setJour] = useState(() => new Date().toISOString().slice(0, 10));

  const donnees = useMemo(() => {
    const duJour = paiements.filter((paiement) => paiement.date.slice(0, 10) === jour);
    const parMode = new Map<PaymentMethod, number>();
    for (const paiement of duJour) {
      parMode.set(paiement.mode, (parMode.get(paiement.mode) ?? 0) + paiement.montant);
    }
    return {
      paiements: duJour.sort((a, b) => b.date.localeCompare(a.date)),
      parMode: [...parMode.entries()],
      total: duJour.reduce((somme, paiement) => somme + paiement.montant, 0),
    };
  }, [paiements, jour]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Caisse du jour</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Tout ce qui a été encaissé, acomptes compris.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <input
            type="date"
            value={jour}
            onChange={(event) => setJour(event.target.value)}
            className="h-9 border border-surface-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 bg-success-light">
          <p className="text-xs text-text-muted uppercase tracking-wide">Total encaissé</p>
          <p className="text-2xl font-semibold text-success">{formatCurrency(donnees.total)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-muted uppercase tracking-wide">Encaissements</p>
          <p className="text-2xl font-semibold text-text-primary">{donnees.paiements.length}</p>
        </Card>
        <Card className="p-4 space-y-1">
          <p className="text-xs text-text-muted uppercase tracking-wide">Par mode</p>
          {donnees.parMode.length === 0 ? (
            <p className="text-sm text-text-muted">—</p>
          ) : (
            donnees.parMode.map(([mode, montant]) => (
              <div key={mode} className="flex justify-between text-sm">
                <span className="text-text-secondary">{MODE_PAIEMENT[mode]}</span>
                <span className="text-text-primary font-medium">{formatCurrency(montant)}</span>
              </div>
            ))
          )}
        </Card>
      </div>

      <Card>
        {donnees.paiements.length === 0 ? (
          <p className="p-6 text-sm text-text-muted text-center">
            Aucun encaissement enregistré pour le {formatDate(jour)}.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Heure</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Facture</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donnees.paiements.map((paiement) => {
                const facture = factures.find((item) => item.id === paiement.facture_id);
                const client = clients.find((item) => item.id === facture?.client_id);
                return (
                  <TableRow key={paiement.id}>
                    <TableCell className="text-text-secondary">
                      {new Date(paiement.date).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {client ? `${client.prenom} ${client.nom}` : '—'}
                    </TableCell>
                    <TableCell>{facture?.numero ?? '—'}</TableCell>
                    <TableCell>{MODE_PAIEMENT[paiement.mode]}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(paiement.montant)}
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

/** Argent: les factures a encaisser et la caisse du jour. */
export function ArgentPage() {
  const [onglet, setOnglet] = useState('factures');
  const factures = useAppDataStore((state) => state.factures);
  const impayees = factures.filter(
    (facture) => facture.statut !== 'CANCELLED' && facture.montant_paye < facture.total_ttc
  ).length;

  return (
    <div className="space-y-5">
      <Tabs
        tabs={[
          { id: 'factures', label: 'Factures', badge: impayees },
          { id: 'caisse', label: 'Caisse du jour' },
        ]}
        active={onglet}
        onChange={setOnglet}
      />
      {onglet === 'factures' && <FacturesPage />}
      {onglet === 'caisse' && <CaisseDuJour />}
    </div>
  );
}
