import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Phone, Mail, Eye, Edit2, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Modal,
} from '@/components/ui';
import { ClientForm } from '@/components/forms';
import { formatDate, formatCurrency } from '@/lib/utils';
import { mockClients, mockClientExtras } from '@/lib/mockData';
import type { Client, ClientInput } from '@/types';

function isInactive(lastVisit: string): boolean {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return new Date(lastVisit) < oneYearAgo;
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnpaid, setFilterUnpaid] = useState(false);
  const [filterInactive, setFilterInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const filteredCustomers = useMemo(() => {
    return clients.filter((customer) => {
      const matchesSearch =
        customer.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.telephone.includes(searchQuery) ||
        customer.code.toLowerCase().includes(searchQuery.toLowerCase());

      const extras = mockClientExtras[customer.id] || { solde: 0, derniere_visite: customer.updated_at };
      const matchesUnpaid = !filterUnpaid || extras.solde > 0;
      const matchesInactive = !filterInactive || isInactive(extras.derniere_visite);

      return matchesSearch && matchesUnpaid && matchesInactive;
    });
  }, [clients, searchQuery, filterUnpaid, filterInactive]);

  const handleCreateClient = async (data: ClientInput) => {
    const newId = Math.max(...clients.map(c => c.id)) + 1;
    const newCode = `CLI-${String(newId).padStart(4, '0')}`;
    const newClient: Client = {
      id: newId,
      code: newCode,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setClients(prev => [newClient, ...prev]);
  };

  const handleUpdateClient = async (data: ClientInput) => {
    if (!editingClient) return;
    setClients(prev => prev.map(c => 
      c.id === editingClient.id 
        ? { ...c, ...data, updated_at: new Date().toISOString() }
        : c
    ));
    setEditingClient(null);
  };

  const handleDeleteClient = () => {
    if (!deletingClient) return;
    setClients(prev => prev.filter(c => c.id !== deletingClient.id));
    setDeletingClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Clients</h1>
          <p className="text-text-secondary mt-1">
            Gérez vos clients et leur historique
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Rechercher par nom, téléphone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <button
              onClick={() => setFilterUnpaid(!filterUnpaid)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filterUnpaid
                  ? 'bg-accent-light border-accent text-accent'
                  : 'border-surface-border text-text-secondary hover:bg-cream'
              }`}
            >
              Avec solde
            </button>
            <button
              onClick={() => setFilterInactive(!filterInactive)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filterInactive
                  ? 'bg-accent-light border-accent text-accent'
                  : 'border-surface-border text-text-secondary hover:bg-cream'
              }`}
            >
              Inactifs (+1 an)
            </button>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Dernière visite</TableHead>
              <TableHead>Solde</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => {
              const extras = mockClientExtras[customer.id] || { solde: 0, derniere_visite: customer.updated_at };
              return (
                <TableRow key={customer.id}>
                  <TableCell className="font-mono text-sm">{customer.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">
                          {customer.prenom} {customer.nom}
                        </p>
                        {customer.email && (
                          <p className="text-sm text-text-secondary flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </p>
                        )}
                      </div>
                      {isInactive(extras.derniere_visite) && (
                        <Badge variant="warning">Inactif</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-text-muted" />
                      {customer.telephone}
                    </span>
                  </TableCell>
                  <TableCell>{customer.ville || '-'}</TableCell>
                  <TableCell>{formatDate(extras.derniere_visite)}</TableCell>
                  <TableCell>
                    {extras.solde > 0 ? (
                      <Badge variant="danger">
                        {formatCurrency(extras.solde)}
                      </Badge>
                    ) : (
                      <span className="text-success">0 DA</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/clients/${customer.id}`}>
                        <Button variant="ghost" size="sm" title="Voir">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Modifier"
                        onClick={() => setEditingClient(customer)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Supprimer"
                        onClick={() => setDeletingClient(customer)}
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredCustomers.length === 0 && (
          <div className="py-12 text-center text-text-secondary">
            Aucun client trouvé
          </div>
        )}

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
          <p className="text-sm text-text-secondary">
            {filteredCustomers.length} client(s) trouvé(s)
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Précédent
            </Button>
            <Button variant="outline" size="sm" disabled>
              Suivant
            </Button>
          </div>
        </div>
      </Card>

      {/* Create Client Form */}
      <ClientForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateClient}
        title="Nouveau client"
      />

      {/* Edit Client Form */}
      {editingClient && (
        <ClientForm
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          onSubmit={handleUpdateClient}
          initialData={editingClient}
          title="Modifier client"
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Êtes-vous sûr de vouloir supprimer le client{' '}
            <strong className="text-text-primary">{deletingClient?.prenom} {deletingClient?.nom}</strong> ?
          </p>
          <p className="text-sm text-text-muted">
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeletingClient(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteClient}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
