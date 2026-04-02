import { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Card, 
  Badge, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  Modal, 
  Textarea 
} from '@/components/ui';
import { 
  deleteListeItemWeb,
  getListeByIdWeb,
  getListesWeb,
  getOrCreateTodayListWeb,
  groupLensItemsWeb,
  populateListeFromOrdersWeb,
  updateListeItemWeb,
  updateListeStatutWeb,
} from '@/lib/web/listeVerresWeb';
import type { ListeVerres, ListeVerreItem, ListeVerresWithItems, GroupedLensItem } from '@/types';

export function ListeVerresPage() {
  const [listes, setListes] = useState<ListeVerres[]>([]);
  const [currentListe, setCurrentListe] = useState<ListeVerresWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [groupedItems, setGroupedItems] = useState<GroupedLensItem[]>([]);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');

  const loadTodayList = useCallback(async () => {
    try {
      setLoading(true);
      const liste = await getOrCreateTodayListWeb();
      const listeWithItems = await getListeByIdWeb(liste.id);
      setCurrentListe(listeWithItems);
      if (listeWithItems) {
        setGroupedItems(groupLensItemsWeb(listeWithItems.items));
      }
    } catch (error) {
      console.error('Error loading today list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const allListes = await getListesWeb();
      setListes(allListes);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, []);

  useEffect(() => {
    loadTodayList();
    loadHistory();
  }, [loadTodayList, loadHistory]);

  const handleRefreshFromOrders = async () => {
    if (!currentListe) return;
    
    try {
      const addedCount = await populateListeFromOrdersWeb(currentListe.id, currentListe.date);
      if (addedCount > 0) {
        await loadTodayList();
        alert(`${addedCount} verre(s) ajouté(s) depuis les commandes du jour.`);
      } else {
        alert('Aucun nouveau verre à ajouter.');
      }
    } catch (error) {
      console.error('Error refreshing from orders:', error);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const handleToggleInStock = async (item: ListeVerreItem) => {
    try {
      await updateListeItemWeb(item.id, { en_stock: !item.en_stock });
      await loadTodayList();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Supprimer cet élément de la liste?')) return;
    
    try {
      await deleteListeItemWeb(itemId);
      await loadTodayList();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleUpdateStatus = async (newStatus: 'ENVOYEE' | 'RECUE') => {
    if (!currentListe) return;
    
    try {
      await updateListeStatutWeb(currentListe.id, newStatus, statusNotes);
      setShowStatusModal(false);
      setStatusNotes('');
      await loadTodayList();
      await loadHistory();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleLoadHistoryList = async (id: number) => {
    try {
      const liste = await getListeByIdWeb(id);
      setCurrentListe(liste);
      if (liste) {
        setGroupedItems(groupLensItemsWeb(liste.items));
      }
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading list:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'BROUILLON':
        return <Badge variant="default">Brouillon</Badge>;
      case 'ENVOYEE':
        return <Badge variant="info">Envoyée</Badge>;
      case 'RECUE':
        return <Badge variant="success">Reçue</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const itemsToOrder = currentListe?.items.filter(i => !i.en_stock) || [];
  const itemsInStock = currentListe?.items.filter(i => i.en_stock) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Liste des Verres à Commander
          </h1>
          {currentListe && (
            <p className="text-text-secondary mt-1">
              {formatDate(currentListe.date)} • {getStatusBadge(currentListe.statut)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowHistory(true)}>
            Historique
          </Button>
          <Button variant="secondary" onClick={() => loadTodayList()}>
            Aujourd'hui
          </Button>
        </div>
      </div>

      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-text-secondary">À commander: </span>
              <span className="font-semibold text-text-primary">{itemsToOrder.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-text-secondary">En stock: </span>
              <span className="font-semibold text-green-600">{itemsInStock.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-text-secondary">Total: </span>
              <span className="font-semibold text-text-primary">{currentListe?.items.length || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentListe?.statut === 'BROUILLON' && (
              <>
                <Button variant="secondary" onClick={handleRefreshFromOrders}>
                  + Ajouter depuis commandes
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => setShowStatusModal(true)}
                  disabled={itemsToOrder.length === 0}
                >
                  Marquer comme envoyée
                </Button>
              </>
            )}
            {currentListe?.statut === 'ENVOYEE' && (
              <Button 
                variant="primary" 
                onClick={() => handleUpdateStatus('RECUE')}
              >
                Marquer comme reçue
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowPrintView(true)}>
              Imprimer
            </Button>
          </div>
        </div>
      </Card>

      {/* Grouped View */}
      {groupedItems.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Indice</TableHead>
                <TableHead>Sphère</TableHead>
                <TableHead>Cylindre</TableHead>
                <TableHead>Axe</TableHead>
                <TableHead>Addition</TableHead>
                <TableHead>Traitements</TableHead>
                <TableHead className="text-center">Qté</TableHead>
                <TableHead>Clients</TableHead>
                <TableHead className="text-center">En stock</TableHead>
                <TableHead>&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedItems.map((group, idx) => (
                <TableRow key={idx} className={group.allInStock ? 'bg-green-50/50' : ''}>
                  <TableCell className="font-medium">
                    {group.type_verre || '-'}
                  </TableCell>
                  <TableCell>{group.indice || '-'}</TableCell>
                  <TableCell>{group.sphere != null ? (group.sphere > 0 ? `+${group.sphere}` : group.sphere) : '-'}</TableCell>
                  <TableCell>{group.cylindre != null ? group.cylindre : '-'}</TableCell>
                  <TableCell>{group.axe != null ? `${group.axe}°` : '-'}</TableCell>
                  <TableCell>{group.addition != null ? `+${group.addition}` : '-'}</TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {group.traitements || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={group.count > 1 ? 'primary' : 'default'}>
                      {group.count}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="text-sm text-text-secondary truncate">
                      {group.items.map(i => `${i.client_nom} (${i.oeil})`).join(', ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {group.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleInStock(item)}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded mx-0.5 transition-colors ${
                          item.en_stock 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                        }`}
                        title={`${item.client_nom} - ${item.oeil}`}
                      >
                        {item.en_stock ? '✓' : '○'}
                      </button>
                    ))}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {group.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Supprimer"
                        >
                          ×
                        </button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-text-secondary mb-4">
            Aucun verre dans la liste pour aujourd'hui.
          </p>
          <Button variant="primary" onClick={handleRefreshFromOrders}>
            Charger depuis les commandes du jour
          </Button>
        </Card>
      )}

      {/* Detailed Items View */}
      {currentListe && currentListe.items.length > 0 && (
        <Card>
          <div className="p-4 border-b border-border">
            <h3 className="font-medium text-text-primary">Détail par client</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Œil</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Correction</TableHead>
                <TableHead>Traitements</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentListe.items.map(item => (
                <TableRow key={item.id} className={item.en_stock ? 'bg-green-50/50' : ''}>
                  <TableCell className="font-medium">{item.client_nom}</TableCell>
                  <TableCell>
                    <Badge variant={item.oeil === 'OD' ? 'info' : 'warning'}>
                      {item.oeil}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.type_verre || '-'} {item.indice ? `(${item.indice})` : ''}</TableCell>
                  <TableCell>
                    SPH: {item.sphere != null ? (item.sphere > 0 ? `+${item.sphere}` : item.sphere) : '-'}
                    {item.cylindre != null && ` / CYL: ${item.cylindre}`}
                    {item.axe != null && ` / AXE: ${item.axe}°`}
                    {item.addition != null && ` / ADD: +${item.addition}`}
                  </TableCell>
                  <TableCell>{item.traitements || '-'}</TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggleInStock(item)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        item.en_stock 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.en_stock ? 'En stock ✓' : 'À commander'}
                    </button>
                  </TableCell>
                  <TableCell className="text-text-secondary text-sm">
                    {item.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* History Modal */}
      <Modal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)}
        title="Historique des listes"
        size="lg"
      >
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">En stock</TableHead>
                <TableHead>&nbsp;</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listes.map(liste => (
                <TableRow key={liste.id}>
                  <TableCell>{formatDate(liste.date)}</TableCell>
                  <TableCell>{getStatusBadge(liste.statut)}</TableCell>
                  <TableCell className="text-center">{liste.items_count || 0}</TableCell>
                  <TableCell className="text-center">{liste.items_en_stock || 0}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleLoadHistoryList(liste.id)}
                    >
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Envoyer la commande"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Vous allez marquer cette liste comme envoyée au fournisseur.
            <br />
            <strong>{itemsToOrder.length} verre(s)</strong> à commander.
          </p>
          <Textarea
            label="Notes (optionnel)"
            placeholder="Référence de commande, remarques..."
            value={statusNotes}
            onChange={e => setStatusNotes(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={() => handleUpdateStatus('ENVOYEE')}>
              Confirmer l'envoi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Print View Modal */}
      <Modal
        isOpen={showPrintView}
        onClose={() => setShowPrintView(false)}
        title="Aperçu impression"
        size="lg"
      >
        <div className="print-content p-4 bg-white">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Liste des verres à commander</h2>
            <p className="text-gray-600">{currentListe && formatDate(currentListe.date)}</p>
          </div>
          
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="p-2 text-left">Client</th>
                <th className="p-2 text-left">Œil</th>
                <th className="p-2 text-left">Type/Indice</th>
                <th className="p-2 text-left">SPH</th>
                <th className="p-2 text-left">CYL</th>
                <th className="p-2 text-left">AXE</th>
                <th className="p-2 text-left">ADD</th>
                <th className="p-2 text-left">Traitements</th>
              </tr>
            </thead>
            <tbody>
              {itemsToOrder.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.client_nom}</td>
                  <td className="p-2">{item.oeil}</td>
                  <td className="p-2">{item.type_verre} {item.indice}</td>
                  <td className="p-2">{item.sphere != null ? (item.sphere > 0 ? `+${item.sphere}` : item.sphere) : '-'}</td>
                  <td className="p-2">{item.cylindre ?? '-'}</td>
                  <td className="p-2">{item.axe != null ? `${item.axe}°` : '-'}</td>
                  <td className="p-2">{item.addition != null ? `+${item.addition}` : '-'}</td>
                  <td className="p-2">{item.traitements || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Total: {itemsToOrder.length} verre(s)
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowPrintView(false)}>
            Fermer
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            Imprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
