import { formatDate } from '@/lib/utils';
import { useAppDataStore } from '@/stores/appDataStore';
import type { Client, Commande, Ordonnance } from '@/types';

interface FicheAtelierProps {
  commande: Commande;
  client?: Client;
  ordonnance?: Ordonnance;
}

function valeurOptique(value?: number, suffixe = ''): string {
  if (value == null) return '—';
  const signe = value > 0 ? '+' : '';
  return `${signe}${value.toFixed(2)}${suffixe}`;
}

/**
 * Fiche d'atelier: le papier qui part au montage avec la monture.
 * Volontairement dense et lisible de loin, sans aucun prix.
 */
export function FicheAtelierPrintTemplate({
  commande,
  client,
  ordonnance,
}: FicheAtelierProps) {
  const nomMagasin = useAppDataStore((state) => state.parametres.nom_magasin);
  const nomClient = client ? `${client.nom} ${client.prenom}` : 'Client';
  const lignes = commande.lignes ?? [];

  return (
    <article className="atelier-print-page">
      <header className="atelier-header">
        <div>
          <h1>Fiche d'atelier</h1>
          <p>{nomMagasin}</p>
        </div>
        <div className="atelier-numero">
          <strong>{commande.numero}</strong>
          <span>{formatDate(commande.date_commande)}</span>
        </div>
      </header>

      <section className="atelier-client">
        <div>
          <span className="atelier-label">Client</span>
          <strong>{nomClient}</strong>
        </div>
        <div>
          <span className="atelier-label">Téléphone</span>
          <strong>{client?.telephone || '—'}</strong>
        </div>
        <div>
          <span className="atelier-label">À livrer le</span>
          <strong>
            {commande.date_livraison_prevue
              ? formatDate(commande.date_livraison_prevue)
              : 'à définir'}
          </strong>
        </div>
      </section>

      <table className="atelier-correction">
        <thead>
          <tr>
            <th>Œil</th>
            <th>Sphère</th>
            <th>Cylindre</th>
            <th>Axe</th>
            <th>Addition</th>
            <th>Écart</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>O.D.</th>
            <td>{valeurOptique(ordonnance?.od_sphere)}</td>
            <td>{valeurOptique(ordonnance?.od_cylindre)}</td>
            <td>{ordonnance?.od_axe != null ? `${ordonnance.od_axe}°` : '—'}</td>
            <td>{valeurOptique(ordonnance?.od_addition)}</td>
            <td rowSpan={2}>
              {ordonnance?.ecart_pupillaire != null ? `${ordonnance.ecart_pupillaire} mm` : '—'}
            </td>
          </tr>
          <tr>
            <th>O.G.</th>
            <td>{valeurOptique(ordonnance?.og_sphere)}</td>
            <td>{valeurOptique(ordonnance?.og_cylindre)}</td>
            <td>{ordonnance?.og_axe != null ? `${ordonnance.og_axe}°` : '—'}</td>
            <td>{valeurOptique(ordonnance?.og_addition)}</td>
          </tr>
        </tbody>
      </table>

      <section className="atelier-articles">
        <h2>À monter</h2>
        <ul>
          {lignes.length === 0 && <li>—</li>}
          {lignes.map((ligne) => (
            <li key={ligne.id}>
              <span>{ligne.description}</span>
              {ligne.quantite > 1 && <span className="atelier-qte">×{ligne.quantite}</span>}
              {ligne.a_commander && <span className="atelier-tag">à commander</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="atelier-notes">
        <h2>Remarques atelier</h2>
        <p>{commande.notes_atelier || ' '}</p>
      </section>

      <footer className="atelier-footer">
        <div>Monté par : ____________</div>
        <div>Contrôlé le : ____________</div>
        <div>Client prévenu le : ____________</div>
      </footer>
    </article>
  );
}
