import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Package,
  Clock,
  ArrowRight,
  FileText,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { mockDashboardStats, mockClients, mockCommandes, mockProduits } from '@/lib/mockData';

// Prepare dashboard data from mock data
const stats = mockDashboardStats;

const recentCustomers = mockClients
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 4)
  .map(c => ({
    id: c.id,
    code: c.code,
    name: `${c.prenom} ${c.nom}`,
    phone: c.telephone,
    date: c.created_at,
  }));

const pendingOrders = mockCommandes
  .filter(c => !['DLV', 'CAN'].includes(c.statut))
  .sort((a, b) => new Date(b.date_commande).getTime() - new Date(a.date_commande).getTime())
  .slice(0, 4)
  .map(cmd => {
    const client = mockClients.find(c => c.id === cmd.client_id);
    return {
      id: cmd.id,
      numero: cmd.numero,
      customer: client ? `${client.prenom} ${client.nom}` : 'Client inconnu',
      status: cmd.statut,
      date: cmd.date_commande,
      amount: cmd.total_ttc,
    };
  });

const lowStockProducts = mockProduits
  .filter(p => p.quantite <= p.stock_minimum)
  .slice(0, 3)
  .map(p => ({
    id: p.id,
    name: p.nom,
    stock: p.quantite,
    min: p.stock_minimum,
    critical: p.quantite <= Math.floor(p.stock_minimum / 2),
  }));

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'primary' | 'default' }> = {
  NEW: { label: 'Nouvelle', variant: 'default' },
  ORD: { label: 'Commandée', variant: 'warning' },
  RCV: { label: 'Reçue', variant: 'info' },
  ASM: { label: 'Montage', variant: 'primary' },
  RDY: { label: 'Prête', variant: 'success' },
  DLV: { label: 'Livrée', variant: 'success' },
  CAN: { label: 'Annulée', variant: 'default' },
};

export function DashboardPage() {
  const percentChange = stats.ca_mois_precedent > 0 
    ? ((stats.ca_mois - stats.ca_mois_precedent) / stats.ca_mois_precedent * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Tableau de bord
        </h1>
        <p className="text-text-secondary mt-1">
          Bienvenue sur OptiVision - Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="CA du mois"
          value={formatCurrency(stats.ca_mois)}
          subtitle={`${Number(percentChange) >= 0 ? '+' : ''}${percentChange}% vs mois précédent`}
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          title="Clients"
          value={stats.clients_total.toString()}
          subtitle={`${stats.clients_nouveaux_mois} nouveaux ce mois`}
          icon={Users}
          color="success"
          link="/clients"
        />
        <StatCard
          title="Commandes en cours"
          value={stats.commandes_en_cours.toString()}
          subtitle={`${stats.commandes_pret} prête(s) à livrer`}
          icon={ShoppingCart}
          color="warning"
          link="/commandes"
        />
        <StatCard
          title="Impayés"
          value={formatCurrency(stats.montant_impaye)}
          subtitle={`${stats.factures_impayees} facture(s)`}
          icon={CreditCard}
          color="danger"
          link="/factures?filter=unpaid"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Derniers clients
            </CardTitle>
            <Link
              to="/clients"
              className="text-sm text-accent hover:opacity-80 flex items-center gap-1"
            >
              Voir tous <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  to={`/clients/${customer.id}`}
                  className="flex items-center justify-between p-3 rounded-[10px] hover:bg-cream transition-colors"
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      {customer.name}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {customer.phone}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted">{customer.code}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Commandes en cours
            </CardTitle>
            <Link
              to="/commandes"
              className="text-sm text-accent hover:opacity-80 flex items-center gap-1"
            >
              Voir toutes <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/commandes/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-[10px] hover:bg-cream transition-colors"
                >
                  <div>
                    <p className="font-medium text-text-primary">
                      {order.customer}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {order.numero} - {formatDate(order.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusLabels[order.status].variant}>
                      {statusLabels[order.status].label}
                    </Badge>
                    <p className="text-sm font-medium text-text-secondary mt-1">
                      {formatCurrency(order.amount)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-danger" />
              Alertes stock
              {stats.produits_stock_bas > 0 && (
                <Badge variant="danger">{stats.produits_stock_bas}</Badge>
              )}
            </CardTitle>
            <Link
              to="/produits?filter=low-stock"
              className="text-sm text-accent hover:opacity-80 flex items-center gap-1"
            >
              Voir tous <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-2">
                {lowStockProducts.map((product) => (
                  <div 
                    key={product.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-[10px]",
                      product.critical 
                        ? "bg-danger-light" 
                        : "bg-warning-light"
                    )}
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {product.name}
                      </p>
                      <p className={cn(
                        "text-sm",
                        product.critical ? "text-danger" : "text-warning"
                      )}>
                        Stock: {product.stock} (min: {product.min})
                      </p>
                    </div>
                    <Badge variant={product.critical ? "danger" : "warning"}>
                      {product.critical ? 'Critique' : 'Faible'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-4">
                Aucune alerte de stock
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-info" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/clients"
                className="flex flex-col items-center justify-center p-4 rounded-[10px] border border-surface-border hover:bg-cream transition-colors"
              >
                <Users className="h-6 w-6 text-accent mb-2" />
                <span className="text-sm font-medium text-text-primary">Nouveau client</span>
              </Link>
              <Link
                to="/commandes"
                className="flex flex-col items-center justify-center p-4 rounded-[10px] border border-surface-border hover:bg-cream transition-colors"
              >
                <ShoppingCart className="h-6 w-6 text-warning mb-2" />
                <span className="text-sm font-medium text-text-primary">Nouvelle commande</span>
              </Link>
              <Link
                to="/factures"
                className="flex flex-col items-center justify-center p-4 rounded-[10px] border border-surface-border hover:bg-cream transition-colors"
              >
                <FileText className="h-6 w-6 text-success mb-2" />
                <span className="text-sm font-medium text-text-primary">Nouvelle facture</span>
              </Link>
              <Link
                to="/rapports"
                className="flex flex-col items-center justify-center p-4 rounded-[10px] border border-surface-border hover:bg-cream transition-colors"
              >
                <TrendingUp className="h-6 w-6 text-info mb-2" />
                <span className="text-sm font-medium text-text-primary">Rapports</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: 'accent' | 'success' | 'warning' | 'danger';
  link?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color, link }: StatCardProps) {
  const colorClasses = {
    accent: 'bg-accent-light text-accent',
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    danger: 'bg-danger-light text-danger',
  };

  const content = (
    <Card className={cn(link && 'hover:border-accent/30 transition-colors cursor-pointer')}>
      <CardContent className="flex items-center gap-4">
        <div className={cn('p-3 rounded-[10px]', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="text-2xl font-semibold text-text-primary truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted truncate">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (link) {
    return <Link to={link}>{content}</Link>;
  }

  return content;
}
