import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Glasses,
  Phone,
  Plus,
  Receipt,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { ClientForm, OrdonnanceForm } from '@/components/forms';
import { badgeVariant, MODE_PAIEMENT, STATUT_COMMANDE, STATUT_FACTURE } from '@/lib/labels';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAppDataStore } from '@/stores/appDataStore';
import type { ClientInput, Ordonnance, OrdonnanceInput } from '@/types';

/**
 * La fiche client: tout ce que le magasin sait d'une personne,
 * sur un seul ecran.
 */
export function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientId = Number(id);

  const client = useAppDataStore((state) =>
    state.clients.find((item) => item.id === clientId)
  );
  const ordonnances = useAppDataStore((state) => state.ordonnances);
  const commandes = useAppDataStore((state) => state.commandes);
  const factures = useAppDataStore((state) => state.factures);
  const paiements = useAppDataStore((state) => state.paiements);
  const updateClient = useAppDataStore((state) => state.updateClient);
  const createOrdonnance = useAppDataStore((state) => state.createOrdonnance);
  const updateOrdonnance = useAppDataStore((state) => state.updateOrdonnance);
  const deleteOrdonnance = useAppDataStore((state) => state.deleteOrdonnance);

  const [modifierClient, setModifierClient] = useState(false);
  const [nouvelleOrdonnance, setNouvelleOrdonnance] = useState(false);
  const [ordonnanceEnCours, setOrdonnanceEnCours] = useState<Ordonnance | null>(null);
  const [ordonnanceASupprimer, setOrdonnanceASupprimer] = useState<Ordonnance | null>(null);

  const donnees = useMemo(() => {
    const sesOrdonnances = ordonnances
      .filter((ord) => ord.client_id === clientId)
      .sort(
        (a, b) =>
          new Date(b.date_prescription).getTime() - new Date(a.date_prescription).getTime()
      );
    const sesCommandes = commandes
      .filter((cmd) => cmd.client_id === clientId)
      .sort((a, b) => b.date_commande.localeCompare(a.date_commande));
    const sesFactures = factures
      .filter((fac) => fac.client_id === clientId)
      .sort((a, b) => b.date_facture.localeCompare(a.date_facture));

    const totalAchats = sesFactures.reduce((somme, fac) => somme + fac.total_ttc, 0);
    const totalPaye = sesFactures.reduce((somme, fac) => somme + fac.montant_paye, 0);

    return {
      ordonnances: sesOrdonnances,
      commandes: sesCommandes,
      factures: sesFactures,
      totalAchats,
      solde: totalAchats - totalPaye,
      derniereVisite: sesCommandes[0]?.date_commande,
    };
  }, [clientId, ordonnances, commandes, factures]);

  if (!client) {
    return (
      <Card className="p-8 text-center space-y-3">
        <p className="text-text-secondary">Ce client n’existe plus.</p>
        <Link to="/clients">
          <Button variant="outline">Retour à la liste</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              {client.prenom} {client.nom}
            </h1>
            <p className="text-text-secondary text-sm flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {client.telephone}
              </span>
              <span>{client.code}</span>
              {client.date_naissance && <span>né(e) le {formatDate(client.date_naissance)}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setModifierClient(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Link to="/vente">
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Nouvelle vente
            </Button>
          </Link>
        </div>
      </div>

      {/* Chiffres cles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-text-muted uppercase tracking-wide">Total achats</p>
          <p className="text-lg font-semibold text-text-primary">
            {formatCurrency(donnees.totalAchats)}
          </p>
        </Card>
        <Card className={`p-3 ${donnees.solde > 0 ? 'bg-danger-light' : ''}`}>
          <p className="text-xs text-text-muted uppercase tracking-wide">Reste à payer</p>
          <p
            className={`text-lg font-semibold ${
              donnees.solde > 0 ? 'text-danger' : 'text-text-primary'
            }`}
          >
            {formatCurrency(donnees.solde)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-text-muted uppercase tracking-wide">Commandes</p>
          <p className="text-lg font-semibold text-text-primary">{donnees.commandes.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-text-muted uppercase tracking-wide">Dernière visite</p>
          <p className="text-lg font-semibold text-text-primary">
            {donnees.derniereVisite ? formatDate(donnees.derniereVisite) : '—'}
          </p>
        </Card>
      </div>

      {/* Ordonnances */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Glasses className="h-4 w-4" />
            Ordonnances
          </h2>
          <Button variant="outline" size="sm" onClick={() => setNouvelleOrdonnance(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {donnees.ordonnances.length === 0 ? (
          <p className="text-sm text-text-muted">Aucune ordonnance enregistrée.</p>
        ) : (
          <div className="space-y-2">
            {donnees.ordonnances.map((ord, index) => (
              <div
                key={ord.id}
                className="border border-surface-border p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-0.5 text-sm">
                  <p className="font-medium text-text-primary">
                    {formatDate(ord.date_prescription)}
                    {index === 0 && (
                      <Badge variant="success" className="ml-2">
                        la plus récente
                      </Badge>
                    )}
                  </p>
                  <p className="text-text-secondary">
                    OD {ord.od_sphere ?? '—'} ({ord.od_cylindre ?? '—'}){' '}
                    {ord.od_axe != null ? `${ord.od_axe}°` : ''} · OG {ord.og_sphere ?? '—'} (
                    {ord.og_cylindre ?? '—'}) {ord.og_axe != null ? `${ord.og_axe}°` : ''}
                    {ord.ecart_pupillaire ? ` · EP ${ord.ecart_pupillaire}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setOrdonnanceEnCours(ord)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger"
                    onClick={() => setOrdonnanceASupprimer(ord)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Commandes */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          Commandes
        </h2>
        {donnees.commandes.length === 0 ? (
          <p className="text-sm text-text-muted">Aucune commande.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donnees.commandes.map((cmd) => (
                <TableRow key={cmd.id}>
                  <TableCell className="font-medium">{cmd.numero}</TableCell>
                  <TableCell>{formatDate(cmd.date_commande)}</TableCell>
                  <TableCell className="text-text-secondary text-sm">
                    {(cmd.lignes ?? []).map((ligne) => ligne.description).join(', ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(STATUT_COMMANDE[cmd.statut].ton)}>
                      {STATUT_COMMANDE[cmd.statut].court}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(cmd.total_ttc)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Factures */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Factures et paiements
        </h2>
        {donnees.factures.length === 0 ? (
          <p className="text-sm text-text-muted">Aucune facture.</p>
        ) : (
          <div className="space-y-2">
            {donnees.factures.map((fac) => {
              const sesPaiements = paiements.filter((pay) => pay.facture_id === fac.id);
              const reste = fac.total_ttc - fac.montant_paye;
              return (
                <div key={fac.id} className="border border-surface-border p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary">{fac.numero}</span>
                      <span className="text-sm text-text-secondary">
                        {formatDate(fac.date_facture)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={badgeVariant(STATUT_FACTURE[fac.statut].ton)}>
                        {STATUT_FACTURE[fac.statut].label}
                      </Badge>
                      <span className="font-semibold text-text-primary">
                        {formatCurrency(fac.total_ttc)}
                      </span>
                    </div>
                  </div>
                  {reste > 0 && (
                    <p className="text-sm text-danger">Reste {formatCurrency(reste)}</p>
                  )}
                  {sesPaiements.length > 0 && (
                    <ul className="text-xs text-text-secondary space-y-0.5">
                      {sesPaiements.map((pay) => (
                        <li key={pay.id}>
                          {formatDate(pay.date)} — {formatCurrency(pay.montant)} (
                          {MODE_PAIEMENT[pay.mode]})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {client.notes && (
        <Card className="p-4">
          <h2 className="font-semibold text-text-primary mb-1">Notes</h2>
          <p className="text-sm text-text-secondary whitespace-pre-line">{client.notes}</p>
        </Card>
      )}

      {/* Formulaires */}
      <ClientForm
        isOpen={modifierClient}
        onClose={() => setModifierClient(false)}
        onSubmit={async (data: ClientInput) => {
          updateClient(client.id, data);
          setModifierClient(false);
        }}
        initialData={client}
        title="Modifier le client"
      />

      <OrdonnanceForm
        isOpen={nouvelleOrdonnance}
        onClose={() => setNouvelleOrdonnance(false)}
        onSubmit={async (data: OrdonnanceInput) => {
          createOrdonnance({ ...data, client_id: client.id });
          setNouvelleOrdonnance(false);
        }}
        clientId={client.id}
        clientName={`${client.prenom} ${client.nom}`}
      />

      {ordonnanceEnCours && (
        <OrdonnanceForm
          isOpen
          onClose={() => setOrdonnanceEnCours(null)}
          onSubmit={async (data: OrdonnanceInput) => {
            updateOrdonnance(ordonnanceEnCours.id, data);
            setOrdonnanceEnCours(null);
          }}
          clientId={client.id}
          clientName={`${client.prenom} ${client.nom}`}
          initialData={ordonnanceEnCours}
        />
      )}

      <Modal
        isOpen={!!ordonnanceASupprimer}
        onClose={() => setOrdonnanceASupprimer(null)}
        title="Supprimer l’ordonnance"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Supprimer l’ordonnance du{' '}
            {ordonnanceASupprimer && formatDate(ordonnanceASupprimer.date_prescription)} ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOrdonnanceASupprimer(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (ordonnanceASupprimer) deleteOrdonnance(ordonnanceASupprimer.id);
                setOrdonnanceASupprimer(null);
              }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
