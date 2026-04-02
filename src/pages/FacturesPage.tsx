import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Receipt, 
  Calendar, 
  CreditCard,
  Download,
  Eye,
  DollarSign
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Card, 
  Badge, 
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { mockFactures, mockClients } from '@/lib/mockData';
import type { Facture, FactureStatut } from '@/types';

const statusConfig: Record<FactureStatut, { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  DRAFT: { label: 'Brouillon', variant: 'default' },
  SENT: { label: 'Envoyée', variant: 'warning' },
  PAID: { label: 'Payée', variant: 'success' },
  PARTIAL: { label: 'Partielle', variant: 'warning' },
  OVERDUE: { label: 'En retard', variant: 'danger' },
  CANCELLED: { label: 'Annulée', variant: 'default' },
};

type FactureWithClient = Facture & { clientNom: string };

export function FacturesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FactureStatut | 'all'>('all');
  const [filterUnpaid, setFilterUnpaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FactureWithClient | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [invoices, setInvoices] = useState<Facture[]>(mockFactures);

  const invoicesWithClients = useMemo((): FactureWithClient[] => {
    return invoices.map(invoice => {
      const client = mockClients.find(c => c.id === invoice.client_id);
      return {
        ...invoice,
        clientNom: client ? `${client.prenom} ${client.nom}` : 'Client inconnu',
      };
    });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoicesWithClients.filter((invoice) => {
      const matchesSearch =
        invoice.clientNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.numero.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || invoice.statut === filterStatus;
      const matchesUnpaid = !filterUnpaid || (invoice.montant_paye < invoice.total_ttc);

      return matchesSearch && matchesStatus && matchesUnpaid;
    });
  }, [invoicesWithClients, searchQuery, filterStatus, filterUnpaid]);

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, i) => sum + i.total_ttc, 0);
    const paid = invoices.reduce((sum, i) => sum + i.montant_paye, 0);
    const unpaid = total - paid;
    const unpaidCount = invoices.filter(i => i.montant_paye < i.total_ttc).length;
    return { total, paid, unpaid, unpaidCount };
  }, [invoices]);

  const openPaymentModal = (invoice: FactureWithClient) => {
    setSelectedInvoice(invoice);
    setPaymentAmount((invoice.total_ttc - invoice.montant_paye).toString());
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setInvoices(prev => prev.map(inv => {
      if (inv.id !== selectedInvoice.id) return inv;
      const newPaid = Math.min(inv.montant_paye + amount, inv.total_ttc);
      const newStatus: FactureStatut = newPaid >= inv.total_ttc ? 'PAID' : 'PARTIAL';
      return { 
        ...inv, 
        montant_paye: newPaid, 
        statut: newStatus,
        updated_at: new Date().toISOString() 
      };
    }));
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Factures</h1>
          <p className="text-text-muted">
            Gérez vos factures et paiements
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-accent-light">
              <Receipt className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total facturé</p>
              <p className="text-xl font-semibold text-text-primary">
                {formatCurrency(stats.total)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-success-100">
              <CreditCard className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total encaissé</p>
              <p className="text-xl font-semibold text-success">
                {formatCurrency(stats.paid)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-danger-100">
              <DollarSign className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Reste à encaisser</p>
              <p className="text-xl font-semibold text-danger">
                {formatCurrency(stats.unpaid)}
                <span className="text-sm font-normal ml-2">({stats.unpaidCount} factures)</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Rechercher par client, N° facture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-text-muted" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-sm rounded-[10px] border transition-colors ${
                filterStatus === 'all'
                  ? 'bg-accent-light border-accent text-accent'
                  : 'border-surface-border text-text-secondary hover:bg-cream'
              }`}
            >
              Toutes
            </button>
            {(['PAID', 'PARTIAL', 'SENT', 'OVERDUE'] as FactureStatut[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                className={`px-3 py-1.5 text-sm rounded-[10px] border transition-colors ${
                  filterStatus === status
                    ? 'bg-accent-light border-accent text-accent'
                    : 'border-surface-border text-text-secondary hover:bg-cream'
                }`}
              >
                {statusConfig[status].label}
              </button>
            ))}
            <button
              onClick={() => setFilterUnpaid(!filterUnpaid)}
              className={`px-3 py-1.5 text-sm rounded-[10px] border transition-colors ${
                filterUnpaid
                  ? 'bg-danger border-danger text-surface'
                  : 'border-surface-border text-text-secondary hover:bg-cream'
              }`}
            >
              Impayées
            </button>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Facture</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Payé</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => {
              const remaining = invoice.total_ttc - invoice.montant_paye;
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.numero}</TableCell>
                  <TableCell className="font-medium">{invoice.clientNom}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-text-muted" />
                      {formatDate(invoice.date_facture)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.date_echeance ? formatDate(invoice.date_echeance) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(invoice.total_ttc)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={remaining > 0 ? 'text-warning' : 'text-success'}>
                      {formatCurrency(invoice.montant_paye)}
                    </span>
                    {remaining > 0 && (
                      <p className="text-xs text-danger">
                        Reste: {formatCurrency(remaining)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[invoice.statut].variant}>
                      {statusConfig[invoice.statut].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" title="Voir">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Télécharger PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                      {remaining > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openPaymentModal(invoice)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Payer
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredInvoices.length === 0 && (
          <div className="py-12 text-center text-text-muted">
            Aucune facture trouvée
          </div>
        )}

        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
          <p className="text-sm text-text-muted">
            {filteredInvoices.length} facture(s) trouvée(s)
          </p>
        </div>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setSelectedInvoice(null); }}
        title="Enregistrer un paiement"
        size="sm"
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="p-3 rounded-[10px] bg-cream">
              <p className="text-sm text-text-muted">Facture</p>
              <p className="font-semibold">{selectedInvoice.numero}</p>
              <p className="text-sm">{selectedInvoice.clientNom}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-muted">Montant total</p>
                <p className="font-semibold">{formatCurrency(selectedInvoice.total_ttc)}</p>
              </div>
              <div>
                <p className="text-text-muted">Déjà payé</p>
                <p className="font-semibold">{formatCurrency(selectedInvoice.montant_paye)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-text-muted">Reste à payer</p>
                <p className="font-semibold text-danger">
                  {formatCurrency(selectedInvoice.total_ttc - selectedInvoice.montant_paye)}
                </p>
              </div>
            </div>

            <Input
              label="Montant du paiement (DA)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Montant"
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowPaymentModal(false); setSelectedInvoice(null); }}>
                Annuler
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
