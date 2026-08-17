import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Glasses,
  Package,
  Phone,
  Receipt,
  Search,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { STATUT_COMMANDE, badgeVariant } from '@/lib/labels';
import { useAppDataStore } from '@/stores/appDataStore';

/**
 * Aujourd'hui: pas un tableau de bord d'analyse, une liste de ce qu'il
 * reste a faire dans la journee.
 */
export function DashboardPage() {
  const clients = useAppDataStore((state) => state.clients);
  const commandes = useAppDataStore((state) => state.commandes);
  const produits = useAppDataStore((state) => state.produits);
  const factures = useAppDataStore((state) => state.factures);
  const paiements = useAppDataStore((state) => state.paiements);
  const listesVerres = useAppDataStore((state) => state.listesVerres);
  const listeItems = useAppDataStore((state) => state.listeItems);

  const jour = new Date().toISOString().slice(0, 10);

  const donnees = useMemo(() => {
    const encaisseAujourdhui = paiements
      .filter((paiement) => paiement.date.slice(0, 10) === jour)
      .reduce((somme, paiement) => somme + paiement.montant, 0);

    const aPrevenir = commandes
      .filter((commande) => commande.statut === 'RDY')
      .map((commande) => ({
        commande,
        client: clients.find((item) => item.id === commande.client_id),
      }));

    const enRetard = commandes.filter(
      (commande) =>
        !['DLV', 'CAN'].includes(commande.statut) &&
        commande.date_livraison_prevue &&
        commande.date_livraison_prevue < jour
    );

    const listeDuJour = listesVerres.find((liste) => liste.date === jour);
    const verresACommander = listeDuJour
      ? listeItems.filter((item) => item.liste_id === listeDuJour.id && !item.en_stock)
      : [];

    const impayees = factures.filter(
      (facture) => facture.statut !== 'CANCELLED' && facture.montant_paye < facture.total_ttc
    );

    const stockBas = produits.filter(
      (produit) => produit.actif && produit.quantite <= produit.stock_minimum
    );

    return {
      encaisseAujourdhui,
      aPrevenir,
      enRetard,
      verresACommander,
      impayees,
      montantImpaye: impayees.reduce(
        (somme, facture) => somme + (facture.total_ttc - facture.montant_paye),
        0
      ),
      stockBas,
      enCours: commandes.filter((commande) => !['DLV', 'CAN'].includes(commande.statut)).length,
    };
  }, [clients, commandes, produits, factures, paiements, listesVerres, listeItems, jour]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Aujourd’hui</h1>
          <p className="text-text-secondary mt-1 capitalize">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Actions du comptoir */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <QuickAction
          to="/vente"
          icon={ShoppingBag}
          title="Nouvelle vente"
          description="Client, correction, articles, facture"
        />
        <QuickAction
          to="/stock"
          icon={Search}
          title="Chercher un verre"
          description="Vérifier ce qui est disponible"
        />
        <QuickAction
          to="/commandes"
          icon={Glasses}
          title="Commandes"
          description="Montage, prêtes, livrées"
        />
        <QuickAction
          to="/argent"
          icon={Wallet}
          title="Caisse et factures"
          description="Encaisser et suivre les impayés"
        />
      </div>

      {/* Les chiffres du jour */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Encaissé aujourd’hui"
          value={formatCurrency(donnees.encaisseAujourdhui)}
          icon={Wallet}
          color="success"
          link="/argent"
        />
        <StatCard
          title="Clients à prévenir"
          value={donnees.aPrevenir.length.toString()}
          subtitle="lunettes prêtes"
          icon={BellRing}
          color="accent"
          link="/commandes"
        />
        <StatCard
          title="Verres à commander"
          value={donnees.verresACommander.length.toString()}
          subtitle="sur le bon du jour"
          icon={Glasses}
          color="warning"
          link="/commandes"
        />
        <StatCard
          title="Impayés"
          value={formatCurrency(donnees.montantImpaye)}
          subtitle={`${donnees.impayees.length} facture(s)`}
          icon={Receipt}
          color="danger"
          link="/argent"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Appels a passer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-accent" />
              À prévenir : la commande est prête
            </CardTitle>
            <Link
              to="/commandes"
              className="text-sm text-accent hover:opacity-80 flex items-center gap-1"
            >
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {donnees.aPrevenir.length === 0 ? (
              <p className="text-sm text-text-muted py-2">
                Personne à appeler pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {donnees.aPrevenir.slice(0, 5).map(({ commande, client }) => (
                  <Link
                    key={commande.id}
                    to={client ? `/clients/${client.id}` : '/commandes'}
                    className="flex items-center justify-between p-3 bg-success-light hover:opacity-90 transition-opacity"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {client ? `${client.prenom} ${client.nom}` : 'Client inconnu'}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {client?.telephone} • {commande.numero}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-success">
                      {formatCurrency(commande.total_ttc)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commandes en retard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Livraison dépassée
              {donnees.enRetard.length > 0 && (
                <Badge variant="danger">{donnees.enRetard.length}</Badge>
              )}
            </CardTitle>
            <Link
              to="/commandes"
              className="text-sm text-accent hover:opacity-80 flex items-center gap-1"
            >
              Tout voir <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {donnees.enRetard.length === 0 ? (
              <p className="text-sm text-text-muted py-2">
                {donnees.enCours} commande(s) en cours, aucune en retard.
              </p>
            ) : (
              <div className="space-y-2">
                {donnees.enRetard.slice(0, 5).map((commande) => {
                  const client = clients.find((item) => item.id === commande.client_id);
                  return (
                    <div
                      key={commande.id}
                      className="flex items-center justify-between p-3 bg-warning-light"
                    >
                      <div>
                        <p className="font-medium text-text-primary">
                          {client ? `${client.prenom} ${client.nom}` : 'Client inconnu'}
                        </p>
                        <p className="text-sm text-text-secondary">
                          prévue le {formatDate(commande.date_livraison_prevue!)}
                        </p>
                      </div>
                      <Badge variant={badgeVariant(STATUT_COMMANDE[commande.statut].ton)}>
                        {STATUT_COMMANDE[commande.statut].court}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock bas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-danger" />
              Stock à réapprovisionner
              {donnees.stockBas.length > 0 && (
                <Badge variant="danger">{donnees.stockBas.length}</Badge>
              )}
            </CardTitle>
            <Link
              to="/stock"
              className="text-sm text-accent hover:opacity-80 flex items-center gap-1"
            >
              Ouvrir le stock <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {donnees.stockBas.length === 0 ? (
              <p className="text-sm text-text-muted py-2">Aucune alerte de stock.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {donnees.stockBas.slice(0, 6).map((produit) => {
                  const critique = produit.quantite <= Math.floor(produit.stock_minimum / 2);
                  return (
                    <div
                      key={produit.id}
                      className={cn(
                        'flex items-center justify-between p-3',
                        critique ? 'bg-danger-light' : 'bg-warning-light'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">{produit.nom}</p>
                        <p
                          className={cn(
                            'text-sm',
                            critique ? 'text-danger' : 'text-warning'
                          )}
                        >
                          Reste {produit.quantite} (seuil {produit.stock_minimum})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface QuickActionProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

function QuickAction({ to, icon: Icon, title, description }: QuickActionProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border border-surface-border bg-surface p-4 hover:border-accent/40 hover:bg-accent-light/40 transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center bg-accent text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary leading-snug">{description}</p>
      </div>
    </Link>
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
        <div className={cn('p-3', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          {/* Les montants en dinars sont longs: on les laisse respirer. */}
          <p className="text-xl xl:text-2xl font-semibold text-text-primary leading-tight">
            {value}
          </p>
          {subtitle && <p className="text-xs text-text-muted truncate">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}
