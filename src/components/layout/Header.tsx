import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDataStore } from '@/stores/appDataStore';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

interface Resultat {
  id: string;
  titre: string;
  detail: string;
  chemin: string;
}

function chiffres(value: string): string {
  return value.replace(/\D/g, '');
}

/** Recherche unique: un client, une commande ou une facture, par n'importe quel bout. */
export function Header({ sidebarCollapsed }: HeaderProps) {
  const navigate = useNavigate();
  const clients = useAppDataStore((state) => state.clients);
  const commandes = useAppDataStore((state) => state.commandes);
  const factures = useAppDataStore((state) => state.factures);

  const [terme, setTerme] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  const resultats = useMemo<Resultat[]>(() => {
    const recherche = terme.trim().toLowerCase();
    if (recherche.length < 2) return [];
    const tel = chiffres(terme);

    const trouves: Resultat[] = [];

    for (const client of clients) {
      const complet = `${client.prenom} ${client.nom}`.toLowerCase();
      const inverse = `${client.nom} ${client.prenom}`.toLowerCase();
      const match =
        complet.includes(recherche) ||
        inverse.includes(recherche) ||
        (client.code || '').toLowerCase().includes(recherche) ||
        (tel.length >= 3 && chiffres(client.telephone || '').includes(tel));
      if (match) {
        trouves.push({
          id: `c-${client.id}`,
          titre: `${client.prenom} ${client.nom}`,
          detail: `Client • ${client.telephone}`,
          chemin: `/clients/${client.id}`,
        });
      }
      if (trouves.length >= 6) break;
    }

    for (const commande of commandes) {
      if (trouves.length >= 8) break;
      if (commande.numero.toLowerCase().includes(recherche)) {
        trouves.push({
          id: `o-${commande.id}`,
          titre: commande.numero,
          detail: 'Commande',
          chemin: '/commandes',
        });
      }
    }

    for (const facture of factures) {
      if (trouves.length >= 10) break;
      if (facture.numero.toLowerCase().includes(recherche)) {
        trouves.push({
          id: `f-${facture.id}`,
          titre: facture.numero,
          detail: 'Facture',
          chemin: '/argent',
        });
      }
    }

    return trouves;
  }, [terme, clients, commandes, factures]);

  function ouvrir(resultat: Resultat) {
    setTerme('');
    setOuvert(false);
    champ.current?.blur();
    navigate(resultat.chemin);
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-14 bg-surface border-b border-surface-border',
        'transition-[left] duration-200 ease-out',
        sidebarCollapsed ? 'left-16' : 'left-[220px]'
      )}
    >
      <div className="flex h-full items-center justify-between px-5">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            ref={champ}
            type="text"
            placeholder="Chercher un client, une commande, une facture..."
            value={terme}
            onFocus={() => setOuvert(true)}
            onBlur={() => window.setTimeout(() => setOuvert(false), 150)}
            onChange={(event) => {
              setTerme(event.target.value);
              setOuvert(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && resultats.length > 0) ouvrir(resultats[0]);
              if (event.key === 'Escape') setOuvert(false);
            }}
            className={cn(
              'h-9 w-full border border-surface-border bg-cream pl-9 pr-3 text-sm text-text-primary',
              'placeholder:text-text-muted',
              'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent focus:bg-surface'
            )}
          />

          {ouvert && terme.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-11 bg-surface border border-surface-border shadow-lg max-h-80 overflow-y-auto">
              {resultats.length === 0 ? (
                <p className="p-3 text-sm text-text-muted">Aucun résultat.</p>
              ) : (
                resultats.map((resultat) => (
                  <button
                    key={resultat.id}
                    onMouseDown={() => ouvrir(resultat)}
                    className="w-full text-left px-3 py-2 hover:bg-cream transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm text-text-primary">{resultat.titre}</span>
                    <span className="text-xs text-text-muted">{resultat.detail}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>OptiVision</span>
        </div>
      </div>
    </header>
  );
}
