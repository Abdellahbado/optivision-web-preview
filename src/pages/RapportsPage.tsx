import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function RapportsPage() {
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-success-light">
              <BarChart3 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Ventes ce mois</p>
              <p className="text-xl font-semibold text-text-primary">
                {formatCurrency(1250000)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-info-light">
              <Calendar className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Commandes ce mois</p>
              <p className="text-xl font-semibold text-text-primary">47</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-accent-light">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Nouveaux clients</p>
              <p className="text-xl font-semibold text-text-primary">12</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Ventes journalières', desc: 'Détail des ventes par jour' },
              { title: 'Ventes mensuelles', desc: 'Résumé mensuel des ventes' },
              { title: 'Stock faible', desc: 'Produits à commander' },
              { title: 'Clients inactifs', desc: 'Clients sans visite depuis 1 an' },
              { title: 'Commandes en cours', desc: 'Suivi des commandes non livrées' },
              { title: 'Impayés', desc: 'Factures en attente de paiement' },
            ].map((report, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-[10px] border border-surface-border hover:bg-cream transition-colors"
              >
                <div>
                  <p className="font-medium text-text-primary">{report.title}</p>
                  <p className="text-sm text-text-secondary">{report.desc}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
