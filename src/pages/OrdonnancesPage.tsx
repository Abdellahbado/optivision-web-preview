import { useMemo, useState } from 'react';
import { FileText, Calendar, Eye, Plus, Search, Filter, Edit2, Trash2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui';
import { OrdonnanceForm } from '@/components/forms';
import { formatDate } from '@/lib/utils';
import { mockOrdonnances, mockClients } from '@/lib/mockData';
import type { Ordonnance, OrdonnanceInput } from '@/types';

export function OrdonnancesPage() {
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>(mockOrdonnances);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showClientSelect, setShowClientSelect] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [editingOrdonnance, setEditingOrdonnance] = useState<Ordonnance | null>(null);
  const [deletingOrdonnance, setDeletingOrdonnance] = useState<Ordonnance | null>(null);

  const ordonnancesWithClient = useMemo(() => {
    return ordonnances.map((ord) => {
      const client = mockClients.find((c) => c.id === ord.client_id);
      return {
        ...ord,
        clientNom: client ? `${client.prenom} ${client.nom}` : 'Client inconnu',
      };
    });
  }, [ordonnances]);

  const filteredOrdonnances = useMemo(() => {
    return ordonnancesWithClient.filter((ord) => {
      const matchesSearch =
        ord.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.clientNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ord.medecin || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || ord.type_vision === selectedType;
      return matchesSearch && matchesType;
    });
  }, [ordonnancesWithClient, searchQuery, selectedType]);

  const selectedClient = selectedClientId
    ? mockClients.find((c) => c.id === selectedClientId)
    : null;
  const editingClient = editingOrdonnance
    ? mockClients.find((c) => c.id === editingOrdonnance.client_id)
    : null;

  const handleCreateOrdonnance = async (data: OrdonnanceInput) => {
    const newId = Math.max(...ordonnances.map((o) => o.id)) + 1;
    const year = new Date().getFullYear();
    const nextNum = ordonnances.filter((o) => o.numero.includes(`ORD-${year}`)).length + 1;

    const newOrdonnance: Ordonnance = {
      id: newId,
      numero: `ORD-${year}-${String(nextNum).padStart(4, '0')}`,
      ...data,
      created_at: new Date().toISOString(),
    };

    setOrdonnances((prev) => [newOrdonnance, ...prev]);
    setSelectedClientId(null);
  };

  const handleUpdateOrdonnance = async (data: OrdonnanceInput) => {
    if (!editingOrdonnance) return;

    setOrdonnances((prev) =>
      prev.map((o) => (o.id === editingOrdonnance.id ? { ...o, ...data } : o))
    );
    setEditingOrdonnance(null);
  };

  const handleDeleteOrdonnance = () => {
    if (!deletingOrdonnance) return;
    setOrdonnances((prev) => prev.filter((o) => o.id !== deletingOrdonnance.id));
    setDeletingOrdonnance(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Ordonnances</h1>
          <p className="text-text-muted">
            Gérez les prescriptions de vos clients
          </p>
        </div>
        <Button onClick={() => setShowClientSelect(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle ordonnance
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Rechercher N°, client, médecin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={[
                { value: 'all', label: 'Tous les types' },
                { value: 'VL', label: 'Vision de loin' },
                { value: 'VP', label: 'Vision de près' },
                { value: 'VL+VP', label: 'Progressif' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            Liste des ordonnances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Médecin</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Correction</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrdonnances.map((ord) => (
                <TableRow key={ord.id}>
                  <TableCell className="font-mono text-sm">{ord.numero}</TableCell>
                  <TableCell className="font-medium">{ord.clientNom}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-text-muted" />
                      {formatDate(ord.date_prescription)}
                    </span>
                  </TableCell>
                  <TableCell>{ord.medecin || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={ord.type_vision === 'VL+VP' ? 'primary' : 'default'}>
                      {ord.type_vision || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    <div>OD: {ord.od_sphere ?? '—'} / {ord.od_cylindre ?? '—'} x {ord.od_axe ?? '—'}</div>
                    <div>OG: {ord.og_sphere ?? '—'} / {ord.og_cylindre ?? '—'} x {ord.og_axe ?? '—'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" title="Voir">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Modifier" onClick={() => setEditingOrdonnance(ord)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Supprimer"
                        className="text-danger"
                        onClick={() => setDeletingOrdonnance(ord)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredOrdonnances.length === 0 && (
            <div className="py-12 text-center text-text-muted">
              Aucune ordonnance trouvée
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showClientSelect}
        onClose={() => {
          setShowClientSelect(false);
          setSelectedClientId(null);
        }}
        title="Sélectionner un client"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Client"
            value={selectedClientId?.toString() || ''}
            onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value, 10) : null)}
            options={[
              { value: '', label: '-- Choisir --' },
              ...mockClients.map((c) => ({
                value: c.id.toString(),
                label: `${c.prenom} ${c.nom} (${c.code})`,
              })),
            ]}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowClientSelect(false);
                setSelectedClientId(null);
              }}
            >
              Annuler
            </Button>
            <Button onClick={() => setShowClientSelect(false)} disabled={!selectedClientId}>
              Continuer
            </Button>
          </div>
        </div>
      </Modal>

      {selectedClient && (
        <OrdonnanceForm
          isOpen={!!selectedClient && !showClientSelect}
          onClose={() => {
            setSelectedClientId(null);
            setShowClientSelect(false);
          }}
          onSubmit={handleCreateOrdonnance}
          clientId={selectedClient.id}
          clientName={`${selectedClient.prenom} ${selectedClient.nom}`}
        />
      )}

      {editingOrdonnance && (
        <OrdonnanceForm
          isOpen={!!editingOrdonnance}
          onClose={() => setEditingOrdonnance(null)}
          onSubmit={handleUpdateOrdonnance}
          clientId={editingOrdonnance.client_id}
          clientName={editingClient ? `${editingClient.prenom} ${editingClient.nom}` : 'Client inconnu'}
          initialData={editingOrdonnance}
        />
      )}

      <Modal
        isOpen={!!deletingOrdonnance}
        onClose={() => setDeletingOrdonnance(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Êtes-vous sûr de vouloir supprimer l'ordonnance{' '}
            <strong>{deletingOrdonnance?.numero}</strong> ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingOrdonnance(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteOrdonnance}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
