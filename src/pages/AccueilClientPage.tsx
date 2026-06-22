import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Plus,
  Search,
  SkipForward,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
  SearchableProductSelect,
  LensSearchSelect,
  type LensSearchFilters,
} from '@/components/ui';
import { ClientForm, OrdonnanceForm } from '@/components/forms';
import { formatCurrency } from '@/lib/utils';
import { useAppDataStore } from '@/stores/appDataStore';
import type { Client, ClientInput, CommandeInput, OrdonnanceInput } from '@/types';

type StepKey = 'client' | 'ordonnance' | 'commande';
type StepStatus = 'pending' | 'done' | 'skipped';

interface DraftSummary {
  numero: string;
  clientNom: string;
  ordonnanceNumero?: string;
  montureNom?: string;
  verreNom?: string;
  total: number;
  dateLivraisonPrevue?: string;
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

function statusBadge(status: StepStatus) {
  if (status === 'done') return <Badge variant="success">Terminé</Badge>;
  if (status === 'skipped') return <Badge variant="warning">Passé</Badge>;
  return <Badge variant="default">En attente</Badge>;
}

export function AccueilClientPage() {
  const clients = useAppDataStore((state) => state.clients);
  const ordonnances = useAppDataStore((state) => state.ordonnances);
  const produits = useAppDataStore((state) => state.produits);
  const createClient = useAppDataStore((state) => state.createClient);
  const createOrdonnance = useAppDataStore((state) => state.createOrdonnance);
  const createCommande = useAppDataStore((state) => state.createCommande);
  const updateProduitStock = useAppDataStore((state) => state.updateProduitStock);

  const [searchClient, setSearchClient] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrdonnanceId, setSelectedOrdonnanceId] = useState<number | null>(null);
  const [selectedMontureId, setSelectedMontureId] = useState<number | null>(null);
  const [selectedVerreId, setSelectedVerreId] = useState<number | null>(null);
  const [lensFilters, setLensFilters] = useState<LensSearchFilters>({ includeTransposed: true });
  const [dateLivraisonPrevue, setDateLivraisonPrevue] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);

  const [showClientForm, setShowClientForm] = useState(false);
  const [showOrdonnanceForm, setShowOrdonnanceForm] = useState(false);
  const [draftSummary, setDraftSummary] = useState<DraftSummary | null>(null);

  const [skipped, setSkipped] = useState<Record<StepKey, boolean>>({
    client: false,
    ordonnance: false,
    commande: false,
  });

  const clientSearchResults = useMemo(() => {
    if (!searchClient.trim()) return [];

    const phoneTerm = normalizePhone(searchClient);
    const textTerm = searchClient.toLowerCase().trim();

    return clients
      .filter((client) => {
        const prenom = client.prenom.toLowerCase();
        const nom = client.nom.toLowerCase();
        const fullName = `${client.prenom} ${client.nom}`.toLowerCase();
        const reversedFullName = `${client.nom} ${client.prenom}`.toLowerCase();
        const phone = normalizePhone(client.telephone || '');
        const phone2 = normalizePhone(client.telephone2 || '');
        return (
          prenom.includes(textTerm) ||
          nom.includes(textTerm) ||
          fullName.includes(textTerm) ||
          reversedFullName.includes(textTerm) ||
          (client.code || '').toLowerCase().includes(textTerm) ||
          (phoneTerm.length > 0 && (phone.includes(phoneTerm) || phone2.includes(phoneTerm)))
        );
      })
      .slice(0, 6);
  }, [clients, searchClient]);

  const clientOrdonnances = useMemo(() => {
    if (!selectedClient) return [];
    return ordonnances
      .filter((ord) => ord.client_id === selectedClient.id)
      .sort(
        (a, b) =>
          new Date(b.date_prescription).getTime() -
          new Date(a.date_prescription).getTime()
      );
  }, [ordonnances, selectedClient]);

  const selectedOrdonnance = useMemo(
    () => clientOrdonnances.find((ord) => ord.id === selectedOrdonnanceId),
    [clientOrdonnances, selectedOrdonnanceId]
  );

  const montures = useMemo(
    () => produits.filter((p) => p.categorie === 'MON' && p.actif),
    [produits]
  );
  const verres = useMemo(
    () => produits.filter((p) => p.categorie === 'VER' && p.actif),
    [produits]
  );

  const selectedMonture = montures.find((m) => m.id === selectedMontureId);
  const selectedVerre = verres.find((v) => v.id === selectedVerreId);
  const totalCommande = (selectedMonture?.prix_vente || 0) + (selectedVerre?.prix_vente || 0);

  const stepStatus: Record<StepKey, StepStatus> = {
    client: selectedClient ? 'done' : skipped.client ? 'skipped' : 'pending',
    ordonnance: selectedOrdonnance ? 'done' : skipped.ordonnance ? 'skipped' : 'pending',
    commande: draftSummary ? 'done' : skipped.commande ? 'skipped' : 'pending',
  };

  const handleSkipStep = (step: StepKey) => {
    setSkipped((prev) => ({ ...prev, [step]: true }));
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchClient('');
    setShowClientResults(false);
    setSkipped((prev) => ({ ...prev, client: false }));
    setSelectedOrdonnanceId(null);
    setDraftSummary(null);
    setOrderError(null);
  };

  const handleChangeClient = () => {
    setSelectedClient(null);
    setSelectedOrdonnanceId(null);
    setSelectedMontureId(null);
    setSelectedVerreId(null);
    setLensFilters({ includeTransposed: true });
    setDateLivraisonPrevue('');
    setOrderNotes('');
    setOrderError(null);
    setDraftSummary(null);
    setSearchClient('');
    setShowClientResults(false);
  };

  const handleCreateClient = async (data: ClientInput) => {
    const nextClient = createClient(data);
    handleSelectClient(nextClient);
    setShowClientForm(false);
  };

  const handleCreateOrdonnance = async (data: OrdonnanceInput) => {
    if (!selectedClient) return;
    const nextOrdonnance = createOrdonnance({
      ...data,
      client_id: selectedClient.id,
    });
    setSelectedOrdonnanceId(nextOrdonnance.id);
    setSkipped((prev) => ({ ...prev, ordonnance: false }));
    setShowOrdonnanceForm(false);
  };

  const handleCreateDraft = () => {
    setOrderError(null);

    if (!selectedClient) {
      setOrderError('Sélectionnez d’abord un client.');
      return;
    }

    if (!selectedMonture && !selectedVerre) {
      setOrderError('Choisissez au moins une monture ou un verre pour créer un brouillon.');
      return;
    }

    const orderData: CommandeInput = {
      client_id: selectedClient.id,
      ordonnance_id: selectedOrdonnance?.id,
      monture_id: selectedMonture?.id,
      verre_id: selectedVerre?.id,
      date_commande: new Date().toISOString().slice(0, 10),
      date_livraison_prevue: dateLivraisonPrevue || undefined,
      statut: 'NEW',
      total_ht: totalCommande,
      total_ttc: totalCommande,
      notes: orderNotes || undefined,
    };
    const createdOrder = createCommande(orderData);

    if (selectedMonture) {
      updateProduitStock(selectedMonture.id, -1);
    }
    if (selectedVerre) {
      updateProduitStock(selectedVerre.id, -1);
    }

    setDraftSummary({
      numero: createdOrder.numero,
      clientNom: `${selectedClient.prenom} ${selectedClient.nom}`,
      ordonnanceNumero: selectedOrdonnance?.numero,
      montureNom: selectedMonture?.nom,
      verreNom: selectedVerre?.nom,
      total: totalCommande,
      dateLivraisonPrevue: dateLivraisonPrevue || undefined,
    });
    setSkipped((prev) => ({ ...prev, commande: false }));
  };

  const resetFlow = () => {
    setSearchClient('');
    setSelectedClient(null);
    setSelectedOrdonnanceId(null);
    setSelectedMontureId(null);
    setSelectedVerreId(null);
    setLensFilters({ includeTransposed: true });
    setDateLivraisonPrevue('');
    setOrderNotes('');
    setOrderError(null);
    setDraftSummary(null);
    setSkipped({ client: false, ordonnance: false, commande: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Vente client</h1>
          <p className="text-text-secondary mt-1">
            Un parcours simple: client, ordonnance, produits, commande et facture.
          </p>
        </div>
        <Button variant="secondary" onClick={resetFlow}>
          Nouveau passage client
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Card className="p-4 h-fit">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Étapes</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stepStatus.client === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-text-muted" />
                )}
                <span className="text-sm text-text-primary">1. Client</span>
              </div>
              {statusBadge(stepStatus.client)}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stepStatus.ordonnance === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-text-muted" />
                )}
                <span className="text-sm text-text-primary">2. Ordonnance</span>
              </div>
              {statusBadge(stepStatus.ordonnance)}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stepStatus.commande === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-text-muted" />
                )}
                <span className="text-sm text-text-primary">3. Brouillon commande</span>
              </div>
              {statusBadge(stepStatus.commande)}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">Étape 1 — Identifier le client</h2>
              {!selectedClient && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkipStep('client')}
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Passer
                </Button>
              )}
            </div>

            {selectedClient && (
              <div className="p-3 bg-success-light border border-success/20 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-success font-medium">Client sélectionné</p>
                  <p className="text-sm text-text-primary mt-1">
                    {selectedClient.prenom} {selectedClient.nom} • {selectedClient.telephone}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleChangeClient}>
                  <X className="h-4 w-4 mr-2" />
                  Changer client
                </Button>
              </div>
            )}

            {!selectedClient && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                  <Input
                    label="Recherche rapide (téléphone, nom, prénom, code)"
                    placeholder="Ex: 0555 12 34 56, Benali ou CL-001"
                    value={searchClient}
                    onChange={(e) => {
                      setSearchClient(e.target.value);
                      setShowClientResults(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setShowClientResults(true);
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    className="md:self-end"
                    onClick={() => setShowClientResults(true)}
                    disabled={!searchClient.trim()}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>

                {showClientResults && searchClient.trim() && (
                  <div className="space-y-2">
                    {clientSearchResults.length > 0 ? (
                      clientSearchResults.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          className="w-full text-left border border-surface-border bg-surface hover:bg-cream p-3 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-text-primary">
                                {client.prenom} {client.nom}
                              </p>
                              <p className="text-sm text-text-secondary">
                                {client.telephone} • {client.code}
                              </p>
                            </div>
                            <Badge variant="info">Choisir</Badge>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="border border-surface-border bg-cream p-3 text-sm text-text-secondary">
                        Aucun client trouvé pour cette recherche.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowClientForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau client
                  </Button>
                </div>
              </>
            )}
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">Étape 2 — Ordonnance (correction)</h2>
              {!selectedOrdonnance && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkipStep('ordonnance')}
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Passer
                </Button>
              )}
            </div>

            {!selectedClient ? (
              <p className="text-sm text-text-muted">
                Choisissez d’abord un client, ou passez cette étape si vente sans ordonnance.
              </p>
            ) : (
              <>
                <Select
                  label="Ordonnance existante"
                  value={selectedOrdonnanceId ?? ''}
                  onChange={(e) =>
                    setSelectedOrdonnanceId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  options={[
                    { value: '', label: '-- Aucune sélection --' },
                    ...clientOrdonnances.map((ord) => ({
                      value: ord.id,
                      label: `${ord.numero} • ${ord.date_prescription} • ${ord.type_vision || 'N/A'}`,
                    })),
                  ]}
                />
                <Button variant="outline" onClick={() => setShowOrdonnanceForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle ordonnance
                </Button>
              </>
            )}

            {selectedOrdonnance && (
              <div className="p-3 bg-info-light border border-info/20 space-y-1 text-sm">
                <p className="font-medium text-info">Ordonnance sélectionnée: {selectedOrdonnance.numero}</p>
                <p className="text-text-primary">
                  OD: {selectedOrdonnance.od_sphere ?? '—'} / {selectedOrdonnance.od_cylindre ?? '—'} x{' '}
                  {selectedOrdonnance.od_axe ?? '—'}
                </p>
                <p className="text-text-primary">
                  OG: {selectedOrdonnance.og_sphere ?? '—'} / {selectedOrdonnance.og_cylindre ?? '—'} x{' '}
                  {selectedOrdonnance.og_axe ?? '—'}
                </p>
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">Étape 3 — Préparer la commande</h2>
              {!draftSummary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSkipStep('commande')}
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Passer
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <SearchableProductSelect
                label="Monture"
                products={montures}
                value={selectedMontureId}
                onChange={setSelectedMontureId}
                placeholder="Rechercher une monture..."
                emptyMessage="Aucune monture trouvée"
              />
              
              <LensSearchSelect
                label="Verre"
                products={verres}
                value={selectedVerreId}
                onChange={setSelectedVerreId}
                filters={lensFilters}
                onFiltersChange={setLensFilters}
                placeholder="Rechercher un verre..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date livraison prévue"
                type="date"
                value={dateLivraisonPrevue}
                onChange={(e) => setDateLivraisonPrevue(e.target.value)}
              />
              <div className="p-3 bg-cream border border-surface-border self-end">
                <p className="text-sm text-text-secondary">Total estimé</p>
                <p className="text-lg font-semibold text-text-primary">{formatCurrency(totalCommande)}</p>
              </div>
            </div>

            <Textarea
              label="Notes commande"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Remarques atelier, préférences client, urgence..."
              rows={2}
            />

            {orderError && (
              <div className="p-3 bg-danger-light border border-danger/20 text-danger text-sm">
                {orderError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">
                Cette action crée un brouillon de travail pour l’opticien.
              </p>
              <Button onClick={handleCreateDraft}>
                Créer brouillon
              </Button>
            </div>
          </Card>

          {draftSummary && (
            <Card className="p-4 bg-success-light border-success/20 space-y-3">
              <p className="font-semibold text-success">Brouillon créé: {draftSummary.numero}</p>
              <div className="text-sm text-text-primary space-y-1">
                <p><strong>Client:</strong> {draftSummary.clientNom}</p>
                {draftSummary.ordonnanceNumero && <p><strong>Ordonnance:</strong> {draftSummary.ordonnanceNumero}</p>}
                {draftSummary.montureNom && <p><strong>Monture:</strong> {draftSummary.montureNom}</p>}
                {draftSummary.verreNom && <p><strong>Verre:</strong> {draftSummary.verreNom}</p>}
                <p><strong>Total estimé:</strong> {formatCurrency(draftSummary.total)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/commandes">
                  <Button variant="secondary" size="sm">
                    Ouvrir Commandes <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/liste-verres">
                  <Button variant="outline" size="sm">
                    Ouvrir Liste verres
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ClientForm
        isOpen={showClientForm}
        onClose={() => setShowClientForm(false)}
        onSubmit={handleCreateClient}
        title="Nouveau client (arrivée)"
        existingClients={clients}
        onClientFound={handleSelectClient}
      />

      {selectedClient && (
        <OrdonnanceForm
          isOpen={showOrdonnanceForm}
          onClose={() => setShowOrdonnanceForm(false)}
          onSubmit={handleCreateOrdonnance}
          clientId={selectedClient.id}
          clientName={`${selectedClient.prenom} ${selectedClient.nom}`}
        />
      )}
    </div>
  );
}
