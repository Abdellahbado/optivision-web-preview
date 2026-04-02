import { useState, useMemo } from 'react';
import { Plus, Search, List, LayoutGrid, ChevronRight, Eye, ArrowRight } from 'lucide-react';
import { Button, Input, Card, Badge, Modal, Select } from '@/components/ui';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { mockCommandes, mockClients } from '@/lib/mockData';
import type { Commande, CommandeStatut } from '@/types';

const statuses: Record<CommandeStatut, { label: string; color: string; variant: 'info' | 'warning' | 'primary' | 'success' | 'default' | 'danger' }> = {
  NEW: { label: 'Nouvelle', color: 'bg-blue-500', variant: 'info' },
  ORD: { label: 'Commandée', color: 'bg-orange-500', variant: 'warning' },
  RCV: { label: 'Reçue', color: 'bg-yellow-500', variant: 'warning' },
  ASM: { label: 'Montage', color: 'bg-purple-500', variant: 'primary' },
  RDY: { label: 'Prête', color: 'bg-green-500', variant: 'success' },
  DLV: { label: 'Livrée', color: 'bg-gray-500', variant: 'default' },
  CAN: { label: 'Annulée', color: 'bg-red-500', variant: 'danger' },
};

const statusOrder: CommandeStatut[] = ['NEW', 'ORD', 'RCV', 'ASM', 'RDY'];
const statusTransitions: Record<CommandeStatut, CommandeStatut[]> = {
  NEW: ['ORD', 'CAN'],
  ORD: ['RCV', 'CAN'],
  RCV: ['ASM', 'CAN'],
  ASM: ['RDY', 'CAN'],
  RDY: ['DLV', 'CAN'],
  DLV: [],
  CAN: [],
};

type OrderWithClient = Commande & { clientNom: string; clientTel: string };

export function CommandesPage() {
  const [orders, setOrders] = useState<Commande[]>(mockCommandes);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedStatus, setSelectedStatus] = useState<CommandeStatut | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithClient | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<CommandeStatut | ''>('');

  const ordersWithClients = useMemo((): OrderWithClient[] => {
    return orders.map(order => {
      const client = mockClients.find(c => c.id === order.client_id);
      return {
        ...order,
        clientNom: client ? `${client.prenom} ${client.nom}` : 'Client inconnu',
        clientTel: client?.telephone || '',
      };
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return ordersWithClients.filter((order) => {
      const matchesSearch =
        order.clientNom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.clientTel.includes(searchQuery);

      const matchesStatus = !selectedStatus || order.statut === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [ordersWithClients, searchQuery, selectedStatus]);

  const handleStatusChange = () => {
    if (!selectedOrder || !newStatus) return;
    
    setOrders(prev => prev.map(o => 
      o.id === selectedOrder.id 
        ? { ...o, statut: newStatus, updated_at: new Date().toISOString() }
        : o
    ));
    setShowStatusModal(false);
    setSelectedOrder(null);
    setNewStatus('');
  };

  const openStatusModal = (order: OrderWithClient) => {
    setSelectedOrder(order);
    setNewStatus('');
    setShowStatusModal(true);
  };

  const availableTransitions = selectedOrder 
    ? statusTransitions[selectedOrder.statut] 
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Commandes</h1>
          <p className="text-text-muted">
            Suivez et gérez vos commandes
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle commande
        </Button>
      </div>

      {/* Filters & View Toggle */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Rechercher par client, N° commande..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedStatus(null)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-[10px] border transition-colors',
                  !selectedStatus
                    ? 'bg-accent-light border-accent text-accent'
                    : 'border-surface-border text-text-secondary hover:bg-cream'
                )}
              >
                Toutes
              </button>
              {statusOrder.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-[10px] border transition-colors',
                    selectedStatus === status
                      ? 'bg-accent-light border-accent text-accent'
                      : 'border-surface-border text-text-secondary hover:bg-cream'
                  )}
                >
                  {statuses[status].label}
                </button>
              ))}
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2 border-l border-surface-border pl-4">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'p-2 rounded-[10px] transition-colors',
                  viewMode === 'kanban'
                    ? 'bg-accent-light text-accent'
                    : 'text-text-muted hover:bg-cream'
                )}
                title="Vue Kanban"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-[10px] transition-colors',
                  viewMode === 'list'
                    ? 'bg-accent-light text-accent'
                    : 'text-text-muted hover:bg-cream'
                )}
                title="Vue Liste"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusOrder.map((statusCode) => {
            const status = statuses[statusCode];
            const statusOrders = filteredOrders.filter((o) => o.statut === statusCode);

            return (
              <div key={statusCode} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn('w-3 h-3 rounded-full', status.color)} />
                  <h3 className="font-medium text-text-primary">
                    {status.label}
                  </h3>
                  <span className="text-sm text-text-muted">
                    ({statusOrders.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {statusOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openStatusModal(order)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-mono text-sm text-text-muted">
                          {order.numero}
                        </span>
                        {(order.total_ttc - (order.total_ttc * 0)) > 0 && (
                          <Badge variant="danger">Impayé</Badge>
                        )}
                      </div>
                      <p className="font-medium text-text-primary mb-1">
                        {order.clientNom}
                      </p>
                      <p className="text-sm text-text-muted mb-3">
                        {order.clientTel}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">
                          {formatDate(order.date_commande)}
                        </span>
                        <span className="font-medium text-text-primary">
                          {formatCurrency(order.total_ttc)}
                        </span>
                      </div>
                      {statusTransitions[order.statut].length > 0 && (
                        <div className="mt-3 pt-3 border-t border-surface-border">
                          <button className="text-xs text-accent hover:text-accent flex items-center gap-1">
                            Changer statut <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </Card>
                  ))}

                  {statusOrders.length === 0 && (
                    <div className="p-4 text-center text-text-muted border-2 border-dashed border-surface-border rounded-[10px]">
                      Aucune commande
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <div className="divide-y divide-surface-border">
            {filteredOrders.map((order) => {
              const status = statuses[order.statut];
              return (
                <div
                  key={order.id}
                  className="p-4 flex items-center justify-between hover:bg-cream"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-3 h-3 rounded-full', status.color)} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-text-muted">{order.numero}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="font-medium text-text-primary">
                        {order.clientNom}
                      </p>
                      <p className="text-sm text-text-muted">
                        {order.clientTel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-text-primary">
                        {formatCurrency(order.total_ttc)}
                      </p>
                      <p className="text-sm text-text-muted">
                        {order.date_livraison_prevue ? `Livraison: ${formatDate(order.date_livraison_prevue)}` : 'Date non définie'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {statusTransitions[order.statut].length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openStatusModal(order)}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-12 text-center text-text-muted">
              Aucune commande trouvée
            </div>
          )}
        </Card>
      )}

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => { setShowStatusModal(false); setSelectedOrder(null); }}
        title="Changer le statut"
        size="sm"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="p-3 rounded-[10px] bg-cream">
              <p className="text-sm text-text-muted">Commande</p>
              <p className="font-medium text-text-primary">{selectedOrder.numero}</p>
              <p className="text-sm text-text-secondary">{selectedOrder.clientNom}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={statuses[selectedOrder.statut].variant}>
                {statuses[selectedOrder.statut].label}
              </Badge>
              <ArrowRight className="h-4 w-4 text-text-muted" />
              {newStatus ? (
                <Badge variant={statuses[newStatus].variant}>
                  {statuses[newStatus].label}
                </Badge>
              ) : (
                <span className="text-text-muted">?</span>
              )}
            </div>

            <Select
              label="Nouveau statut"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as CommandeStatut)}
              options={[
                { value: '', label: '-- Sélectionner --' },
                ...availableTransitions.map(s => ({
                  value: s,
                  label: statuses[s].label,
                })),
              ]}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowStatusModal(false); setSelectedOrder(null); }}>
                Annuler
              </Button>
              <Button onClick={handleStatusChange} disabled={!newStatus}>
                Confirmer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
