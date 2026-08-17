import { Glasses } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAppDataStore } from '@/stores/appDataStore';
import { getSimpleFoyerOrganicTariffCode } from '@/lib/opticalTariffCodes';
import type { Client, Commande, Facture, Ordonnance, Produit } from '@/types';

interface FacturePrintTemplateProps {
  facture: Facture;
  client?: Client;
  commande?: Commande;
  ordonnance?: Ordonnance;
  monture?: Produit;
  verre?: Produit;
}

function formatOpticalValue(value?: number, suffix = ''): string {
  if (value == null) return '';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}${suffix}`;
}

function formatPrescriptionLine(
  sphere?: number,
  cylindre?: number,
  axe?: number,
  addition?: number
): string {
  const parts = [
    formatOpticalValue(sphere),
    cylindre != null ? `(${formatOpticalValue(cylindre)})` : '',
    axe != null ? `${axe}°` : '',
    addition != null ? `Add ${formatOpticalValue(addition)}` : '',
  ].filter(Boolean);

  return parts.join('  ');
}

const units = [
  '',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
];

const tens: Record<number, string> = {
  20: 'vingt',
  30: 'trente',
  40: 'quarante',
  50: 'cinquante',
  60: 'soixante',
};

function belowHundred(value: number): string {
  if (value < 17) return units[value];
  if (value < 20) return `dix-${units[value - 10]}`;
  if (value < 70) {
    const ten = Math.floor(value / 10) * 10;
    const rest = value % 10;
    if (rest === 0) return tens[ten];
    return `${tens[ten]}${rest === 1 ? ' et ' : '-'}${units[rest]}`;
  }
  if (value < 80) return `soixante-${belowHundred(value - 60)}`;
  if (value === 80) return 'quatre-vingts';
  return `quatre-vingt-${belowHundred(value - 80)}`;
}

function belowThousand(value: number): string {
  if (value < 100) return belowHundred(value);
  const hundred = Math.floor(value / 100);
  const rest = value % 100;
  const prefix = hundred === 1 ? 'cent' : `${units[hundred]} cent`;
  if (rest === 0) return hundred > 1 ? `${prefix}s` : prefix;
  return `${prefix} ${belowHundred(rest)}`;
}

function amountToFrenchWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'zéro dinar algérien';

  const groups: string[] = [];
  const millions = Math.floor(rounded / 1_000_000);
  const thousands = Math.floor((rounded % 1_000_000) / 1_000);
  const rest = rounded % 1_000;

  if (millions > 0) {
    groups.push(`${belowThousand(millions)} million${millions > 1 ? 's' : ''}`);
  }
  if (thousands > 0) {
    groups.push(thousands === 1 ? 'mille' : `${belowThousand(thousands)} mille`);
  }
  if (rest > 0) {
    groups.push(belowThousand(rest));
  }

  return `${groups.join(' ')} dinars algériens`;
}

function amountForPrint(amount?: number): string {
  if (amount == null || Number.isNaN(amount)) return '';
  return Math.round(amount).toLocaleString('fr-DZ');
}

function PriceCell({ amount }: { amount?: number }) {
  return (
    <td className="facture-price-cell">
      <span className="facture-price-amount">{amount != null ? amountForPrint(amount) : ''}</span>
      <span className="facture-price-currency">DA</span>
    </td>
  );
}

function CodeValue({
  code,
  fallback,
}: {
  code?: string;
  fallback: string;
}) {
  return (
    <div className="facture-code-value">
      {code ? <strong>{code}</strong> : <span>{fallback}</span>}
    </div>
  );
}

function GlassesSketch() {
  return (
    <Glasses className="facture-glasses" strokeWidth={2.35} aria-hidden="true" />
  );
}

export function FacturePrintTemplate({
  facture,
  client,
  commande,
  ordonnance,
  monture,
  verre,
}: FacturePrintTemplateProps) {
  const magasin = useAppDataStore((state) => state.parametres);
  const clientName = client ? `${client.nom} ${client.prenom}` : 'Client inconnu';
  const od = ordonnance
    ? formatPrescriptionLine(
        ordonnance.od_sphere,
        ordonnance.od_cylindre,
        ordonnance.od_axe,
        ordonnance.od_addition
      )
    : '';
  const og = ordonnance
    ? formatPrescriptionLine(
        ordonnance.og_sphere,
        ordonnance.og_cylindre,
        ordonnance.og_axe,
        ordonnance.og_addition
      )
    : '';
  const hasOd = od.length > 0;
  const hasOg = og.length > 0;
  const odTariff = ordonnance
    ? getSimpleFoyerOrganicTariffCode(ordonnance.od_sphere, ordonnance.od_cylindre)
    : undefined;
  const ogTariff = ordonnance
    ? getSimpleFoyerOrganicTariffCode(ordonnance.og_sphere, ordonnance.og_cylindre)
    : undefined;
  // Les prix imprimes viennent des lignes reellement vendues.
  // Les codes tarifaires restent affiches, mais ne remplacent plus le prix.
  const lignes = commande?.lignes ?? [];
  const ligneOd = lignes.find((ligne) => ligne.type === 'VERRE_OD');
  const ligneOg = lignes.find((ligne) => ligne.type === 'VERRE_OG');
  const ligneMonture = lignes.find((ligne) => ligne.type === 'MONTURE');
  const autresLignes = lignes.filter(
    (ligne) => !['VERRE_OD', 'VERRE_OG', 'MONTURE'].includes(ligne.type)
  );

  const verrePrice = verre?.prix_vente;
  const odVerrePrice =
    ligneOd?.prix_total ??
    (lignes.length > 0
      ? undefined
      : odTariff?.price ??
        (verrePrice != null && hasOd ? (hasOg ? verrePrice / 2 : verrePrice) : undefined));
  const ogVerrePrice =
    ligneOg?.prix_total ??
    (lignes.length > 0
      ? undefined
      : ogTariff?.price ??
        (verrePrice != null && hasOg ? (hasOd ? verrePrice / 2 : verrePrice) : undefined));
  const montureLabel = ligneMonture?.description ?? monture?.nom ?? '';
  const monturePrice = ligneMonture?.prix_total ?? monture?.prix_vente;
  const afficherMonture = !!ligneMonture || !!monture;

  return (
    <article className="facture-print-page">
      <header className="facture-shop-header">
        <h1>{magasin.nom_magasin}</h1>
        <p>{magasin.specialite}</p>
        <div className="facture-divider" />
        <h2>Verres Correcteurs et Solaires</h2>
        <h2>Lentilles de Contact</h2>
        <h2>Esthétique et de Correction</h2>
        <div className="facture-short-divider" />
        <h3>Facture</h3>
      </header>

      <section className="facture-meta">
        <div className="facture-meta-text">
          <p>
            <strong>N.I.F.N : </strong>{magasin.nif}
          </p>
          <p>
            <strong>N°Article : </strong>{magasin.numero_article}
          </p>
          <p>
            <strong>Date : </strong>{formatDate(facture.date_facture)}
          </p>
        </div>
        <GlassesSketch />
      </section>

      <table className="facture-form-table">
        <colgroup>
          <col className="facture-col-label" />
          <col className="facture-col-value" />
          <col className="facture-col-price" />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={3} className="facture-client-row">
              <strong>Nom et prénom :</strong>
              <span>{clientName}</span>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="facture-center-row">
              Correction de loin et de près
            </td>
          </tr>
          <tr>
            <td className="facture-label-cell">O.D.N° :</td>
            <td className="facture-value-cell">
              <CodeValue code={odTariff?.code} fallback={od} />
            </td>
            <PriceCell amount={odVerrePrice} />
          </tr>
          <tr>
            <td className="facture-label-cell">O.G.N° :</td>
            <td className="facture-value-cell">
              <CodeValue code={ogTariff?.code} fallback={og} />
            </td>
            <PriceCell amount={ogVerrePrice} />
          </tr>
          {afficherMonture && (
            <tr>
              <td className="facture-label-cell">Monture :</td>
              <td className="facture-value-cell">
                <span className="facture-wrapped-text">{montureLabel}</span>
              </td>
              <PriceCell amount={monturePrice} />
            </tr>
          )}
          {autresLignes.map((ligne) => (
            <tr key={ligne.id}>
              <td className="facture-label-cell">
                {ligne.quantite > 1 ? `${ligne.quantite} ×` : ''}
              </td>
              <td className="facture-value-cell">
                <span className="facture-wrapped-text">{ligne.description}</span>
              </td>
              <PriceCell amount={ligne.prix_total} />
            </tr>
          ))}
          <tr>
            <td className="facture-label-cell">Total :</td>
            <td colSpan={2} className="facture-total-price-cell">
              <span>{amountForPrint(facture.total_ttc)}</span>
              <strong>DA</strong>
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="facture-letters-row">
              <strong>Total en lettres :</strong>
              <span>{amountToFrenchWords(facture.total_ttc)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <footer className="facture-print-footer">
        <span>Facture N° {facture.numero}</span>
        {commande && <span>Commande N° {commande.numero}</span>}
      </footer>
    </article>
  );
}
