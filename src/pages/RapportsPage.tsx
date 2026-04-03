import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui';
import { BarChart3, Download, Calendar, Users, Package, TrendingUp, TrendingDown, FileText, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { mockClients, mockCommandes, mockFactures, mockProduits, mockOrdonnances } from '@/lib/mockData';
import { useAuthStore } from '@/stores/authStore';
import { hasPermission } from '@/types';

export function RapportsPage() {
  const { user } = useAuthStore();
  const canSeePrices = hasPermission(user?.role, 'canViewPurchasePrice');
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: firstOfMonth.toISOString().slice(0, 10),
      end: today.toISOString().slice(0, 10),
    };
  });

  // Calculate real stats from mock data
  const stats = useMemo(() => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    // Filter commandes by date
    const commandesInRange = mockCommandes.filter((c) => {
      const date = new Date(c.date_commande);
      return date >= startDate && date <= endDate;
    });

    // Filter factures by date
    const facturesInRange = mockFactures.filter((f) => {
      const date = new Date(f.date_facture);
      return date >= startDate && date <= endDate;
    });

    // Filter ordonnances by date
    const ordonnancesInRange = mockOrdonnances.filter((o) => {
      const date = new Date(o.date_prescription);
      return date >= startDate && date <= endDate;
    });

    // Calculate totals
    const totalVentes = facturesInRange.reduce((sum, f) => sum + f.total_ttc, 0);
    const totalPaye = facturesInRange.reduce((sum, f) => sum + f.montant_paye, 0);
    const totalImpayes = totalVentes - totalPaye;
    const commandesEnCours = commandesInRange.filter((c) => !['DLV', 'CAN'].includes(c.statut)).length;
    
    // New clients (using ordonnances as proxy for visits)
    const uniqueClientIds = new Set(ordonnancesInRange.map((o) => o.client_id));
    const nouveauxClients = uniqueClientIds.size;

    // Low stock products
    const produitsStockBas = mockProduits.filter((p) => p.quantite <= p.stock_minimum);

    // Calculate revenue if admin
    let benefice = 0;
    if (canSeePrices) {
      // Simple calculation: total ventes - estimated cost (using prix_achat)
      const avgMargin = 0.3; // 30% average margin
      benefice = totalVentes * avgMargin;
    }

    return {
      totalVentes,
      totalPaye,
      totalImpayes,
      nombreCommandes: commandesInRange.length,
      commandesEnCours,
      nombreFactures: facturesInRange.length,
      nouveauxClients,
      produitsStockBas: produitsStockBas.length,
      benefice,
    };
  }, [dateRange, canSeePrices]);

  // Generate report data for export
  const generateReport = (type: string) => {
    let data: string[][] = [];
    let filename = '';

    switch (type) {
      case 'ventes':
        filename = `ventes_${dateRange.start}_${dateRange.end}.csv`;
        data = [
          ['Date', 'Facture', 'Client', 'Montant', 'Payé', 'Statut'],
          ...mockFactures.map((f) => [
            f.date_facture,
            f.numero,
            mockClients.find((c) => c.id === f.client_id)?.nom || '-',
            f.total_ttc.toString(),
            f.montant_paye.toString(),
            f.statut,
          ]),
        ];
        break;
      case 'stock':
        filename = `stock_faible_${new Date().toISOString().slice(0, 10)}.csv`;
        const lowStock = mockProduits.filter((p) => p.quantite <= p.stock_minimum);
        data = [
          ['Référence', 'Nom', 'Catégorie', 'Stock actuel', 'Stock minimum'],
          ...lowStock.map((p) => [
            p.reference,
            p.nom,
            p.categorie,
            p.quantite.toString(),
            p.stock_minimum.toString(),
          ]),
        ];
        break;
      case 'commandes':
        filename = `commandes_en_cours_${new Date().toISOString().slice(0, 10)}.csv`;
        const enCours = mockCommandes.filter((c) => !['DLV', 'CAN'].includes(c.statut));
        data = [
          ['Date', 'Numéro', 'Client', 'Statut', 'Montant'],
          ...enCours.map((c) => [
            c.date_commande,
            c.numero,
            mockClients.find((cl) => cl.id === c.client_id)?.nom || '-',
            c.statut,
            c.total_ttc.toString(),
          ]),
        ];
        break;
      case 'impayes':
        filename = `impayes_${new Date().toISOString().slice(0, 10)}.csv`;
        const impayes = mockFactures.filter((f) => f.montant_paye < f.total_ttc);
        data = [
          ['Date', 'Facture', 'Client', 'Total', 'Payé', 'Reste'],
          ...impayes.map((f) => [
            f.date_facture,
            f.numero,
            mockClients.find((c) => c.id === f.client_id)?.nom || '-',
            f.total_ttc.toString(),
            f.montant_paye.toString(),
            (f.total_ttc - f.montant_paye).toString(),
          ]),
        ];
        break;
      default:
        return;
    }

    // Convert to CSV and download
    const csvContent = data.map((row) => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Rapports</h1>
          <p className="text-text-secondary mt-1">
            Analysez votre activité
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Période:</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="w-auto"
            />
            <span className="text-text-muted">à</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="w-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                setDateRange({
                  start: today.toISOString().slice(0, 10),
                  end: today.toISOString().slice(0, 10),
                });
              }}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateRange({
                  start: firstOfMonth.toISOString().slice(0, 10),
                  end: today.toISOString().slice(0, 10),
                });
              }}
            >
              Ce mois
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const firstOfYear = new Date(today.getFullYear(), 0, 1);
                setDateRange({
                  start: firstOfYear.toISOString().slice(0, 10),
                  end: today.toISOString().slice(0, 10),
                });
              }}
            >
              Cette année
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-success-light">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Ventes</p>
              <p className="text-xl font-semibold text-success">
                {formatCurrency(stats.totalVentes)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-info-light">
              <FileText className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Commandes</p>
              <p className="text-xl font-semibold text-text-primary">
                {stats.nombreCommandes}
                {stats.commandesEnCours > 0 && (
                  <span className="text-sm font-normal text-warning ml-2">
                    ({stats.commandesEnCours} en cours)
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-accent-light">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Clients actifs</p>
              <p className="text-xl font-semibold text-text-primary">{stats.nouveauxClients}</p>
            </div>
          </div>
        </Card>

        {stats.totalImpayes > 0 && (
          <Card className="p-4 border-danger/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-danger-light">
                <TrendingDown className="h-5 w-5 text-danger" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Impayés</p>
                <p className="text-xl font-semibold text-danger">
                  {formatCurrency(stats.totalImpayes)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {canSeePrices && (
          <Card className="p-4 border-success/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-success-light">
                <BarChart3 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Bénéfice estimé</p>
                <p className="text-xl font-semibold text-success">
                  {formatCurrency(stats.benefice)}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Alerts */}
      {stats.produitsStockBas > 0 && (
        <Card className="p-4 border-warning/30 bg-warning-light/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div className="flex-1">
              <p className="font-medium text-text-primary">
                {stats.produitsStockBas} produit(s) en stock faible
              </p>
              <p className="text-sm text-text-secondary">
                Consultez le rapport "Stock faible" pour voir les détails
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => generateReport('stock')}>
              <Download className="h-4 w-4 mr-1" />
              Exporter
            </Button>
          </div>
        </Card>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                id: 'ventes',
                title: 'Ventes', 
                desc: 'Détail des factures et paiements',
                icon: TrendingUp,
                color: 'success',
              },
              { 
                id: 'stock',
                title: 'Stock faible', 
                desc: 'Produits à commander',
                icon: Package,
                color: 'warning',
                badge: stats.produitsStockBas > 0 ? stats.produitsStockBas : undefined,
              },
              { 
                id: 'commandes',
                title: 'Commandes en cours', 
                desc: 'Suivi des commandes non livrées',
                icon: FileText,
                color: 'info',
                badge: stats.commandesEnCours > 0 ? stats.commandesEnCours : undefined,
              },
              { 
                id: 'impayes',
                title: 'Impayés', 
                desc: 'Factures en attente de paiement',
                icon: TrendingDown,
                color: 'danger',
              },
            ].map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-[10px] border border-surface-border hover:bg-cream transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-[10px]',
                    report.color === 'success' && 'bg-success-light',
                    report.color === 'warning' && 'bg-warning-light',
                    report.color === 'info' && 'bg-info-light',
                    report.color === 'danger' && 'bg-danger-light',
                  )}>
                    <report.icon className={cn(
                      'h-5 w-5',
                      report.color === 'success' && 'text-success',
                      report.color === 'warning' && 'text-warning',
                      report.color === 'info' && 'text-info',
                      report.color === 'danger' && 'text-danger',
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary">{report.title}</p>
                      {report.badge !== undefined && (
                        <Badge variant={report.color === 'danger' ? 'danger' : 'warning'}>
                          {report.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{report.desc}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => generateReport(report.id)}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
