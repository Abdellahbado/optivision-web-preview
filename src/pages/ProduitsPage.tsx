import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Package } from 'lucide-react';
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
import { ProduitForm } from '@/components/forms';
import { formatCurrency } from '@/lib/utils';
import { mockProduits } from '@/lib/mockData';
import { useAuthStore } from '@/stores/authStore';
import { hasPermission } from '@/types';
import type { Produit, ProduitInput, CategorieType } from '@/types';

const categories: Record<CategorieType, { label: string; variant: 'primary' | 'success' | 'warning' | 'info' | 'default' }> = {
  MON: { label: 'Monture', variant: 'primary' },
  VER: { label: 'Verre', variant: 'success' },
  LEN: { label: 'Lentille', variant: 'info' },
  ACC: { label: 'Accessoire', variant: 'default' },
  SRV: { label: 'Service', variant: 'warning' },
};

export function ProduitsPage() {
  const { user } = useAuthStore();
  const canSeePurchasePrice = hasPermission(user?.role, 'canViewPurchasePrice');
  
  const [products, setProducts] = useState<Produit[]>(mockProduits);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategorieType | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Produit | null>(null);
  const [stockModal, setStockModal] = useState<{ product: Produit; action: 'add' | 'remove' } | null>(null);
  const [stockAmount, setStockAmount] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.marque || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || product.categorie === selectedCategory;
      const matchesLowStock = !showLowStock || product.quantite <= product.stock_minimum;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchQuery, selectedCategory, showLowStock]);

  const handleCreateProduct = async (data: ProduitInput) => {
    const newId = Math.max(...products.map(p => p.id)) + 1;
    const newProduct: Produit = {
      id: newId,
      ...data,
      actif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleUpdateProduct = async (data: ProduitInput) => {
    if (!editingProduct) return;
    setProducts(prev => prev.map(p => 
      p.id === editingProduct.id 
        ? { ...p, ...data, updated_at: new Date().toISOString() }
        : p
    ));
    setEditingProduct(null);
  };

  const handleDeleteProduct = () => {
    if (!deletingProduct) return;
    setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
    setDeletingProduct(null);
  };

  const handleStockUpdate = () => {
    if (!stockModal || !stockAmount) return;
    const amount = parseInt(stockAmount);
    if (isNaN(amount) || amount <= 0) return;

    setProducts(prev => prev.map(p => {
      if (p.id !== stockModal.product.id) return p;
      const newQty = stockModal.action === 'add' 
        ? p.quantite + amount 
        : Math.max(0, p.quantite - amount);
      return { ...p, quantite: newQty, updated_at: new Date().toISOString() };
    }));
    setStockModal(null);
    setStockAmount('');
  };

  const lowStockCount = products.filter(p => p.quantite <= p.stock_minimum).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Produits</h1>
          <p className="text-text-muted">
            Gérez votre inventaire de produits
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau produit
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Card className="p-4 bg-warning-light border-warning/20">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-warning" />
            <p className="text-sm text-text-primary">
              <strong>{lowStockCount} produit(s)</strong> ont un stock inférieur au minimum.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLowStock(true)}
              className="ml-auto"
            >
              Voir
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Rechercher par nom, référence, marque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-text-muted" />
            {(Object.entries(categories) as [CategorieType, typeof categories[CategorieType]][]).map(([code, { label }]) => (
              <button
                key={code}
                onClick={() => setSelectedCategory(selectedCategory === code ? null : code)}
                className={`px-3 py-1.5 text-sm rounded-[10px] border transition-colors ${
                  selectedCategory === code
                    ? 'bg-accent-light border-surface-border text-accent'
                    : 'border-surface-border text-text-secondary hover:bg-cream'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-3 py-1.5 text-sm rounded-[10px] border transition-colors ${
                showLowStock
                  ? 'bg-danger border-danger text-white'
                  : 'border-surface-border text-text-secondary hover:bg-cream'
              }`}
            >
              Stock faible
            </button>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Marque</TableHead>
              {canSeePurchasePrice && (
                <TableHead className="text-right">Prix achat</TableHead>
              )}
              <TableHead className="text-right">Prix vente</TableHead>
              {canSeePurchasePrice && (
                <TableHead className="text-right">Marge</TableHead>
              )}
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const prixAchat = product.prix_achat ?? 0;
              const margin = product.prix_vente - prixAchat;
              const marginPercent = prixAchat > 0 
                ? Math.round((margin / prixAchat) * 100) 
                : 0;
              
              return (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-sm">{product.reference}</TableCell>
                <TableCell className="font-medium">{product.nom}</TableCell>
                <TableCell>
                  <Badge variant={categories[product.categorie].variant}>
                    {categories[product.categorie].label}
                  </Badge>
                </TableCell>
                <TableCell>{product.marque || '-'}</TableCell>
                {canSeePurchasePrice && (
                  <TableCell className="text-right text-text-secondary">
                    {formatCurrency(prixAchat)}
                  </TableCell>
                )}
                <TableCell className="text-right font-medium">
                  {formatCurrency(product.prix_vente)}
                </TableCell>
                {canSeePurchasePrice && (
                  <TableCell className="text-right">
                    <span className={margin > 0 ? 'text-success' : 'text-danger'}>
                      {formatCurrency(margin)} ({marginPercent}%)
                    </span>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={
                        product.quantite <= product.stock_minimum
                          ? 'text-danger font-medium'
                          : ''
                      }
                    >
                      {product.quantite}
                    </span>
                    {product.quantite <= product.stock_minimum && (
                      <span className="text-text-muted text-sm">
                        (min: {product.stock_minimum})
                      </span>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setStockModal({ product, action: 'add' })}
                        className="w-6 h-6 flex items-center justify-center rounded-[10px] bg-success text-white hover:bg-success"
                        title="Ajouter au stock"
                      >
                        +
                      </button>
                      <button
                        onClick={() => setStockModal({ product, action: 'remove' })}
                        className="w-6 h-6 flex items-center justify-center rounded-[10px] bg-danger text-white hover:bg-danger"
                        title="Retirer du stock"
                      >
                        −
                      </button>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Modifier"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      title="Supprimer"
                      onClick={() => setDeletingProduct(product)}
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

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-text-muted">
            Aucun produit trouvé
          </div>
        )}

        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
          <p className="text-sm text-text-muted">
            {filteredProducts.length} produit(s) trouvé(s)
          </p>
        </div>
      </Card>

      {/* Create Product Form */}
      <ProduitForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateProduct}
      />

      {/* Edit Product Form */}
      {editingProduct && (
        <ProduitForm
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleUpdateProduct}
          initialData={editingProduct}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Êtes-vous sûr de vouloir supprimer le produit{' '}
            <strong>{deletingProduct?.nom}</strong> ?
          </p>
          <p className="text-sm text-text-muted">
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeletingProduct(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteProduct}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stock Update Modal */}
      <Modal
        isOpen={!!stockModal}
        onClose={() => { setStockModal(null); setStockAmount(''); }}
        title={stockModal?.action === 'add' ? 'Ajouter au stock' : 'Retirer du stock'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Produit: <strong>{stockModal?.product.nom}</strong>
          </p>
          <p className="text-sm text-text-muted">
            Stock actuel: {stockModal?.product.quantite}
          </p>
          <Input
            label="Quantité"
            type="number"
            min="1"
            value={stockAmount}
            onChange={(e) => setStockAmount(e.target.value)}
            placeholder="Entrez la quantité"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setStockModal(null); setStockAmount(''); }}>
              Annuler
            </Button>
            <Button 
              onClick={handleStockUpdate}
              disabled={!stockAmount || parseInt(stockAmount) <= 0}
            >
              {stockModal?.action === 'add' ? 'Ajouter' : 'Retirer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
