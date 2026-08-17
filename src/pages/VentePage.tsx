import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Glasses, Plus, Printer, Search, Trash2, UserPlus, X } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Input,
  LensSearchSelect,
  Modal,
  Select,
  SearchableProductSelect,
  Textarea,
  type LensSearchFilters,
} from '@/components/ui';
import { ClientForm, OrdonnanceForm } from '@/components/forms';
import { FacturePrintTemplate } from '@/components/factures/FacturePrintTemplate';
import { FicheAtelierPrintTemplate } from '@/components/impression/FicheAtelierPrintTemplate';
import { formatCurrency } from '@/lib/utils';
import { MODE_PAIEMENT_OPTIONS } from '@/lib/labels';
import { clientCorrespond } from '@/lib/recherche';
import { useAppDataStore } from '@/stores/appDataStore';
import { LIGNE_LABELS } from '@/types';
import type {
  Client,
  ClientInput,
  Commande,
  Facture,
  LigneType,
  Ordonnance,
  OrdonnanceInput,
  PaymentMethod,
  Produit,
  VenteLigne,
} from '@/types';

/* ------------------------------------------------------------------ */

const CATEGORIE_PAR_LIGNE: Record<LigneType, Produit['categorie'] | null> = {
  MONTURE: 'MON',
  VERRE_OD: 'VER',
  VERRE_OG: 'VER',
  LENTILLE: 'LEN',
  ACCESSOIRE: 'ACC',
  SERVICE: 'SRV',
};

function formatDateFr(value?: string): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/**
 * Disponibilite d'un verre pour une correction donnee, transposition comprise.
 * Sert a dire tout de suite si le verre est en stock ou s'il faut le commander.
 */
function verreCorrespond(produit: Produit, filtres: LensSearchFilters): boolean {
  if (filtres.type) {
    const terme = filtres.type.toLowerCase();
    const traitements = produit.verre?.traitements?.join(' ').toLowerCase() || '';
    const notes = produit.notes?.toLowerCase() || '';
    const nom = produit.nom.toLowerCase();
    const typeVerre = produit.verre?.type_verre?.toLowerCase() || '';
    const coating = produit.verre?.coating_type?.toLowerCase() || '';
    if (
      !traitements.includes(terme) &&
      !notes.includes(terme) &&
      !nom.includes(terme) &&
      !typeVerre.includes(terme) &&
      !coating.includes(terme)
    ) {
      return false;
    }
  }

  if (filtres.sphere === undefined || filtres.cylinder === undefined) return true;
  const verre = produit.verre;
  if (!verre) return true;

  const sphereMin = verre.sphere_min ?? -20;
  const sphereMax = verre.sphere_max ?? 20;
  const cylMax = verre.cylindre_max ?? 6;
  const directOk =
    filtres.sphere >= sphereMin &&
    filtres.sphere <= sphereMax &&
    Math.abs(filtres.cylinder) <= cylMax;
  const sphereTransposee = filtres.sphere + filtres.cylinder;
  const cylindreTranspose = -filtres.cylinder;
  const transposeOk =
    (filtres.includeTransposed ?? true) &&
    sphereTransposee >= sphereMin &&
    sphereTransposee <= sphereMax &&
    Math.abs(cylindreTranspose) <= cylMax;

  return directOk || transposeOk;
}

function nouvelleLigne(type: LigneType): VenteLigne {
  return {
    cle: `${type}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    description: '',
    quantite: 1,
    prix_unitaire: 0,
    a_commander: false,
  };
}

/* ------------------------------------------------------------------ */

export function VentePage() {
  const clients = useAppDataStore((state) => state.clients);
  const ordonnances = useAppDataStore((state) => state.ordonnances);
  const produits = useAppDataStore((state) => state.produits);
  const createClient = useAppDataStore((state) => state.createClient);
  const createOrdonnance = useAppDataStore((state) => state.createOrdonnance);
  const updateOrdonnance = useAppDataStore((state) => state.updateOrdonnance);
  const deleteOrdonnance = useAppDataStore((state) => state.deleteOrdonnance);
  const enregistrerVente = useAppDataStore((state) => state.enregistrerVente);

  const [recherche, setRecherche] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [ordonnanceId, setOrdonnanceId] = useState<number | null>(null);
  const [lignes, setLignes] = useState<VenteLigne[]>([]);
  const [filtresVerres, setFiltresVerres] = useState<Record<string, LensSearchFilters>>({});
  const [remise, setRemise] = useState('');
  const [totalManuel, setTotalManuel] = useState('');
  const [acompte, setAcompte] = useState('');
  const [modePaiement, setModePaiement] = useState<PaymentMethod>('ESP');
  const [dateLivraison, setDateLivraison] = useState('');
  const [notesAtelier, setNotesAtelier] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const [formClient, setFormClient] = useState(false);
  const [formOrdonnance, setFormOrdonnance] = useState(false);
  const [ordonnanceAModifier, setOrdonnanceAModifier] = useState<Ordonnance | null>(null);
  const [ordonnanceASupprimer, setOrdonnanceASupprimer] = useState<Ordonnance | null>(null);
  const [resultat, setResultat] = useState<{ commande: Commande; facture: Facture } | null>(null);

  const champRecherche = useRef<HTMLInputElement>(null);

  /* ----------------------------- Recherche client ----------------------------- */

  // Meme recherche que partout ailleurs (nom, telephone, code, naissance).
  const resultats = useMemo(() => {
    if (!recherche.trim()) return [];
    return clients.filter((item) => clientCorrespond(item, recherche)).slice(0, 6);
  }, [clients, recherche]);

  const ordonnancesClient = useMemo(() => {
    if (!client) return [];
    return ordonnances
      .filter((ord) => ord.client_id === client.id)
      .sort(
        (a, b) =>
          new Date(b.date_prescription).getTime() - new Date(a.date_prescription).getTime()
      );
  }, [ordonnances, client]);

  const ordonnance = ordonnancesClient.find((ord) => ord.id === ordonnanceId);

  // La derniere ordonnance est celle qu'on utilise dans presque tous les cas.
  useEffect(() => {
    if (client && ordonnanceId === null && ordonnancesClient.length > 0) {
      setOrdonnanceId(ordonnancesClient[0].id);
    }
  }, [client, ordonnanceId, ordonnancesClient]);

  /* ----------------------------- Lignes ----------------------------- */

  const produitsParCategorie = useMemo(() => {
    const actifs = produits.filter((produit) => produit.actif);
    return {
      MON: actifs.filter((produit) => produit.categorie === 'MON'),
      VER: actifs.filter((produit) => produit.categorie === 'VER'),
      LEN: actifs.filter((produit) => produit.categorie === 'LEN'),
      ACC: actifs.filter((produit) => produit.categorie === 'ACC'),
      SRV: actifs.filter((produit) => produit.categorie === 'SRV'),
    };
  }, [produits]);

  function ajouterLigne(type: LigneType) {
    const ligne = nouvelleLigne(type);
    if ((type === 'VERRE_OD' || type === 'VERRE_OG') && ordonnance) {
      const droit = type === 'VERRE_OD';
      setFiltresVerres((prev) => ({
        ...prev,
        [ligne.cle]: {
          sphere: droit ? ordonnance.od_sphere : ordonnance.og_sphere,
          cylinder: droit ? ordonnance.od_cylindre : ordonnance.og_cylindre,
          axis: droit ? ordonnance.od_axe : ordonnance.og_axe,
          type: ordonnance.type_vision === 'VL+VP' ? 'progressif' : 'unifocal',
          includeTransposed: true,
        },
      }));
    }
    setLignes((prev) => [...prev, ligne]);
    setErreur(null);
  }

  function majLigne(cle: string, patch: Partial<VenteLigne>) {
    setLignes((prev) =>
      prev.map((ligne) => (ligne.cle === cle ? { ...ligne, ...patch } : ligne))
    );
  }

  function retirerLigne(cle: string) {
    setLignes((prev) => prev.filter((ligne) => ligne.cle !== cle));
  }

  function choisirProduit(ligne: VenteLigne, produitId: number | null) {
    if (produitId === null) {
      majLigne(ligne.cle, { produit_id: undefined, description: '', prix_unitaire: 0 });
      return;
    }
    const produit = produits.find((item) => item.id === produitId);
    if (!produit) return;
    majLigne(ligne.cle, {
      produit_id: produit.id,
      description: produit.nom,
      prix_unitaire: produit.prix_vente,
      prix_achat_unitaire: produit.prix_achat,
      // Hors stock: la ligne part automatiquement sur le bon de commande.
      a_commander: produit.categorie !== 'SRV' && produit.quantite <= 0,
    });
  }

  /* ------------------- Disponibilite automatique des verres ------------------- */

  /**
   * Des qu'un type de verre est choisi, on regarde le stock pour cette
   * correction: le vendeur voit tout de suite s'il faut commander.
   */
  const disponibilites = useMemo(() => {
    const resultat: Record<string, { correspondants: number; enStock: number }> = {};
    for (const ligne of lignes) {
      if (ligne.type !== 'VERRE_OD' && ligne.type !== 'VERRE_OG') continue;
      const filtres = filtresVerres[ligne.cle];
      if (!filtres || (filtres.sphere === undefined && !filtres.type)) continue;
      const correspondants = produitsParCategorie.VER.filter((produit) =>
        verreCorrespond(produit, filtres)
      );
      resultat[ligne.cle] = {
        correspondants: correspondants.length,
        enStock: correspondants.filter((produit) => produit.quantite > 0).length,
      };
    }
    return resultat;
  }, [lignes, filtresVerres, produitsParCategorie]);

  // Aucun verre disponible pour cette correction: la ligne passe en «a commander».
  useEffect(() => {
    for (const ligne of lignes) {
      const dispo = disponibilites[ligne.cle];
      if (!dispo || ligne.produit_id || ligne.a_commander) continue;
      if (dispo.enStock === 0) {
        majLigne(ligne.cle, { a_commander: true });
      }
    }
  }, [disponibilites, lignes]);

  /* ----------------------------- Totaux ----------------------------- */

  const brut = lignes.reduce((somme, ligne) => somme + ligne.prix_unitaire * ligne.quantite, 0);
  const remiseNum = Math.min(Math.max(0, Number(remise) || 0), brut);
  // Le prix final reste modifiable a la main: arrangement, geste commercial, forfait.
  const totalCalcule = brut - remiseNum;
  const totalSaisi = totalManuel.trim() === '' ? undefined : Number(totalManuel);
  const total =
    totalSaisi !== undefined && Number.isFinite(totalSaisi) && totalSaisi >= 0
      ? totalSaisi
      : totalCalcule;
  const acompteNum = Math.min(Math.max(0, Number(acompte) || 0), total);
  const reste = total - acompteNum;

  /* ----------------------------- Enregistrement ----------------------------- */

  function enregistrer() {
    setErreur(null);
    if (!client) {
      setErreur('Choisissez le client avant d’enregistrer.');
      return;
    }
    const valides = lignes.filter((ligne) => ligne.description.trim() && ligne.quantite > 0);
    if (valides.length === 0) {
      setErreur('Ajoutez au moins un article (monture, verre, lentille, accessoire ou service).');
      return;
    }

    const vente = enregistrerVente({
      client_id: client.id,
      ordonnance_id: ordonnance?.id,
      lignes: valides,
      remise_montant: remiseNum,
      total_force: totalSaisi !== undefined && Number.isFinite(totalSaisi) ? total : undefined,
      acompte: acompteNum,
      mode_paiement: modePaiement,
      date_livraison_prevue: dateLivraison || undefined,
      notes_atelier: notesAtelier || undefined,
    });
    setResultat(vente);
  }

  function nouvelleVente() {
    setRecherche('');
    setClient(null);
    setOrdonnanceId(null);
    setLignes([]);
    setFiltresVerres({});
    setRemise('');
    setTotalManuel('');
    setAcompte('');
    setModePaiement('ESP');
    setDateLivraison('');
    setNotesAtelier('');
    setErreur(null);
    setResultat(null);
    champRecherche.current?.focus();
  }

  // Raccourcis clavier: le comptoir travaille au clavier.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'F2') {
        event.preventDefault();
        nouvelleVente();
      }
      if (event.key === 'F9') {
        event.preventDefault();
        if (!resultat) enregistrer();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function imprimer(type: 'facture' | 'atelier') {
    const classe = type === 'facture' ? 'printing-facture' : 'printing-atelier';
    document.body.classList.add(classe);
    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => document.body.classList.remove(classe), 250);
    }, 50);
  }

  const montureLigne = lignes.find((ligne) => ligne.type === 'MONTURE' && ligne.produit_id);
  const verreLigne = lignes.find(
    (ligne) => (ligne.type === 'VERRE_OD' || ligne.type === 'VERRE_OG') && ligne.produit_id
  );

  /* ----------------------------- Rendu ----------------------------- */

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Nouvelle vente</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Client, correction, articles, paiement — puis facture et fiche d’atelier.
          </p>
        </div>
        <Button variant="secondary" onClick={nouvelleVente}>
          Vider l’écran <span className="ml-2 text-xs opacity-70">F2</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-4">
          {/* -------- Client -------- */}
          <Card className="p-4 space-y-3">
            {client ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-text-primary">
                    {client.prenom} {client.nom}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {client.telephone}
                    {client.date_naissance ? ` • ${formatDateFr(client.date_naissance)}` : ''} •{' '}
                    {client.code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/clients/${client.id}`}>
                    <Button variant="ghost" size="sm">
                      Voir la fiche
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => setClient(null)}>
                    <X className="h-4 w-4 mr-1" />
                    Changer
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      ref={champRecherche}
                      label="Client — téléphone, nom, code"
                      placeholder="0555 12 34 56, Benali, CLI-0001..."
                      value={recherche}
                      onChange={(event) => setRecherche(event.target.value)}
                      autoFocus
                    />
                  </div>
                  <Button variant="outline" onClick={() => setFormClient(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nouveau
                  </Button>
                </div>

                {recherche.trim() && (
                  <div className="space-y-1.5">
                    {resultats.length === 0 ? (
                      <p className="text-sm text-text-muted border border-surface-border bg-cream p-3">
                        Aucun client trouvé. Utilisez « Nouveau ».
                      </p>
                    ) : (
                      resultats.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setClient(item);
                            setRecherche('');
                          }}
                          className="w-full text-left border border-surface-border bg-surface hover:bg-cream p-2.5 transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm text-text-primary font-medium">
                            {item.prenom} {item.nom}
                          </span>
                          <span className="text-sm text-text-secondary">{item.telephone}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </Card>

          {/* -------- Correction -------- */}
          {client && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
                  Correction
                </h2>
                <Button variant="outline" size="sm" onClick={() => setFormOrdonnance(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle ordonnance
                </Button>
              </div>

              {ordonnancesClient.length === 0 ? (
                <p className="text-sm text-text-muted">
                  Aucune ordonnance enregistrée. Vente possible sans correction (accessoire,
                  réparation, monture seule).
                </p>
              ) : (
                <Select
                  value={ordonnanceId ?? ''}
                  onChange={(event) =>
                    setOrdonnanceId(event.target.value ? Number(event.target.value) : null)
                  }
                  options={[
                    { value: '', label: 'Sans ordonnance' },
                    ...ordonnancesClient.map((ord, index) => ({
                      value: ord.id,
                      label: `${formatDateFr(ord.date_prescription)}${
                        index === 0 ? ' (la plus récente)' : ''
                      }`,
                    })),
                  ]}
                />
              )}

              {ordonnance && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-cream border border-surface-border p-2.5">
                      <p className="text-xs text-text-muted uppercase tracking-wide">Œil droit</p>
                      <p className="text-text-primary font-medium">
                        {ordonnance.od_sphere ?? '—'} ({ordonnance.od_cylindre ?? '—'}){' '}
                        {ordonnance.od_axe != null ? `${ordonnance.od_axe}°` : ''}
                      </p>
                    </div>
                    <div className="bg-cream border border-surface-border p-2.5">
                      <p className="text-xs text-text-muted uppercase tracking-wide">Œil gauche</p>
                      <p className="text-text-primary font-medium">
                        {ordonnance.og_sphere ?? '—'} ({ordonnance.og_cylindre ?? '—'}){' '}
                        {ordonnance.og_axe != null ? `${ordonnance.og_axe}°` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Une correction se corrige: modifiable et supprimable ici meme. */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrdonnanceAModifier(ordonnance)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      onClick={() => setOrdonnanceASupprimer(ordonnance)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* -------- Articles -------- */}
          {client && (
            <Card className="p-4 space-y-4">
              <h2 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
                Articles
              </h2>

              {lignes.length === 0 && (
                <p className="text-sm text-text-muted">
                  Ajoutez ce que le client achète. La monture est facultative s’il garde la sienne.
                </p>
              )}

              <div className="space-y-3">
                {lignes.map((ligne) => {
                  const categorie = CATEGORIE_PAR_LIGNE[ligne.type];
                  const liste = categorie ? produitsParCategorie[categorie] : [];
                  const estVerre = ligne.type === 'VERRE_OD' || ligne.type === 'VERRE_OG';

                  return (
                    <div
                      key={ligne.cle}
                      className="border border-surface-border p-3 space-y-3 bg-surface"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="info">{LIGNE_LABELS[ligne.type]}</Badge>
                        <button
                          onClick={() => retirerLigne(ligne.cle)}
                          className="text-text-muted hover:text-danger transition-colors"
                          title="Retirer cette ligne"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {estVerre ? (
                        <LensSearchSelect
                          products={produitsParCategorie.VER}
                          value={ligne.produit_id ?? null}
                          onChange={(id) => choisirProduit(ligne, id)}
                          filters={filtresVerres[ligne.cle] ?? { includeTransposed: true }}
                          onFiltersChange={(filters) =>
                            setFiltresVerres((prev) => ({ ...prev, [ligne.cle]: filters }))
                          }
                          placeholder="Rechercher un verre..."
                          hideCorrectionInputs
                        />
                      ) : (
                        <SearchableProductSelect
                          products={liste}
                          value={ligne.produit_id ?? null}
                          onChange={(id) => choisirProduit(ligne, id)}
                          placeholder={`Rechercher ${LIGNE_LABELS[ligne.type].toLowerCase()}...`}
                        />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_90px_140px] gap-3">
                        <Input
                          label="Désignation sur la facture"
                          value={ligne.description}
                          onChange={(event) =>
                            majLigne(ligne.cle, { description: event.target.value })
                          }
                          placeholder="Ex: verre HMC 1.56"
                        />
                        <Input
                          label="Qté"
                          type="number"
                          min="1"
                          value={ligne.quantite}
                          onChange={(event) =>
                            majLigne(ligne.cle, { quantite: Math.max(1, Number(event.target.value)) })
                          }
                        />
                        <Input
                          label="Prix (DA)"
                          type="number"
                          min="0"
                          value={ligne.prix_unitaire}
                          onChange={(event) =>
                            majLigne(ligne.cle, {
                              prix_unitaire: Math.max(0, Number(event.target.value)),
                            })
                          }
                        />
                      </div>

                      {/* Verification automatique du stock pour cette correction */}
                      {estVerre && disponibilites[ligne.cle] && (
                        <div
                          className={`p-2.5 text-sm border ${
                            disponibilites[ligne.cle].enStock > 0
                              ? 'bg-success-light border-success/20 text-success'
                              : 'bg-warning-light border-warning/20 text-warning'
                          }`}
                        >
                          {disponibilites[ligne.cle].enStock > 0
                            ? `${disponibilites[ligne.cle].enStock} verre(s) disponible(s) en stock pour cette correction.`
                            : 'Aucun verre en stock pour cette correction : la ligne passe en commande fournisseur.'}
                        </div>
                      )}

                      <label className="flex items-center gap-2 text-sm text-text-secondary">
                        <input
                          type="checkbox"
                          checked={ligne.a_commander}
                          onChange={(event) =>
                            majLigne(ligne.cle, { a_commander: event.target.checked })
                          }
                          className="h-4 w-4 accent-accent"
                        />
                        À commander chez le fournisseur (pas en stock)
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(
                  ['MONTURE', 'VERRE_OD', 'VERRE_OG', 'LENTILLE', 'ACCESSOIRE', 'SERVICE'] as LigneType[]
                ).map((type) => (
                  <Button key={type} variant="outline" size="sm" onClick={() => ajouterLigne(type)}>
                    <Plus className="h-4 w-4 mr-1" />
                    {LIGNE_LABELS[type]}
                  </Button>
                ))}
              </div>
            </Card>
          )}

          {/* -------- Livraison -------- */}
          {client && (
            <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="À livrer le"
                type="date"
                value={dateLivraison}
                onChange={(event) => setDateLivraison(event.target.value)}
              />
              <Textarea
                label="Remarques atelier"
                rows={2}
                value={notesAtelier}
                onChange={(event) => setNotesAtelier(event.target.value)}
                placeholder="Urgence, préférence de montage, monture du client..."
              />
            </Card>
          )}
        </div>

        {/* -------- Colonne argent -------- */}
        <Card className="p-4 space-y-4 xl:sticky xl:top-4">
          <h2 className="font-semibold text-text-primary text-sm uppercase tracking-wide">
            Paiement
          </h2>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Articles</span>
              <span>{formatCurrency(brut)}</span>
            </div>
            <Input
              label="Remise (DA)"
              type="number"
              min="0"
              value={remise}
              onChange={(event) => setRemise(event.target.value)}
              placeholder="0"
            />
            <Input
              label="Prix final (modifiable)"
              type="number"
              min="0"
              value={totalManuel}
              onChange={(event) => setTotalManuel(event.target.value)}
              placeholder={`Calculé : ${totalCalcule}`}
              hint="Laissez vide pour garder le total calculé."
            />
            <div className="flex justify-between items-baseline border-t border-surface-border pt-2 mt-2">
              <span className="text-text-primary font-medium">Total</span>
              <span className="text-xl font-semibold text-text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="space-y-3 border-t border-surface-border pt-3">
            <Input
              label="Acompte reçu (DA)"
              type="number"
              min="0"
              value={acompte}
              onChange={(event) => setAcompte(event.target.value)}
              placeholder="0"
            />
            <Select
              label="Mode"
              value={modePaiement}
              onChange={(event) => setModePaiement(event.target.value as PaymentMethod)}
              options={MODE_PAIEMENT_OPTIONS}
            />
            <div
              className={`p-2.5 text-sm flex justify-between ${
                reste > 0 ? 'bg-warning-light text-warning' : 'bg-success-light text-success'
              }`}
            >
              <span>{reste > 0 ? 'Reste à payer' : 'Payé en totalité'}</span>
              <strong>{formatCurrency(reste)}</strong>
            </div>
          </div>

          {erreur && (
            <p className="p-2.5 bg-danger-light border border-danger/20 text-danger text-sm">
              {erreur}
            </p>
          )}

          <Button className="w-full" size="lg" onClick={enregistrer}>
            <Printer className="h-4 w-4 mr-2" />
            Enregistrer et imprimer
          </Button>
          <p className="text-xs text-text-muted text-center">
            Raccourci F9. Le stock, la facture et le bon de commande sont mis à jour ensemble.
          </p>
        </Card>
      </div>

      {/* -------- Formulaires -------- */}
      <ClientForm
        isOpen={formClient}
        onClose={() => setFormClient(false)}
        onSubmit={async (data: ClientInput) => {
          const cree = createClient(data);
          setClient(cree);
          setRecherche('');
          setFormClient(false);
        }}
        title="Nouveau client"
        existingClients={clients}
        onClientFound={(trouve: Client) => {
          setClient(trouve);
          setFormClient(false);
        }}
      />

      {client && (
        <OrdonnanceForm
          isOpen={formOrdonnance}
          onClose={() => setFormOrdonnance(false)}
          onSubmit={async (data: OrdonnanceInput) => {
            const creee: Ordonnance = createOrdonnance({ ...data, client_id: client.id });
            setOrdonnanceId(creee.id);
            setFormOrdonnance(false);
          }}
          clientId={client.id}
          clientName={`${client.prenom} ${client.nom}`}
        />
      )}

      {ordonnanceAModifier && client && (
        <OrdonnanceForm
          isOpen
          onClose={() => setOrdonnanceAModifier(null)}
          onSubmit={async (data: OrdonnanceInput) => {
            updateOrdonnance(ordonnanceAModifier.id, data);
            setOrdonnanceAModifier(null);
          }}
          clientId={client.id}
          clientName={`${client.prenom} ${client.nom}`}
          initialData={ordonnanceAModifier}
        />
      )}

      <Modal
        isOpen={!!ordonnanceASupprimer}
        onClose={() => setOrdonnanceASupprimer(null)}
        title="Supprimer l’ordonnance"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Supprimer l’ordonnance du{' '}
            {ordonnanceASupprimer && formatDateFr(ordonnanceASupprimer.date_prescription)} ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOrdonnanceASupprimer(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!ordonnanceASupprimer) return;
                deleteOrdonnance(ordonnanceASupprimer.id);
                if (ordonnanceId === ordonnanceASupprimer.id) setOrdonnanceId(null);
                setOrdonnanceASupprimer(null);
              }}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>

      {/* -------- Documents -------- */}
      <Modal
        isOpen={!!resultat}
        onClose={nouvelleVente}
        title={`Vente enregistrée — ${resultat?.facture.numero ?? ''}`}
        size="xl"
      >
        {resultat && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => imprimer('facture')}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer la facture
              </Button>
              <Button variant="secondary" onClick={() => imprimer('atelier')}>
                <Glasses className="h-4 w-4 mr-2" />
                Imprimer la fiche d’atelier
              </Button>
              <Button variant="outline" onClick={nouvelleVente}>
                <Search className="h-4 w-4 mr-2" />
                Client suivant
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto bg-cream p-4 space-y-6 facture-print-preview">
              <FacturePrintTemplate
                facture={resultat.facture}
                client={client ?? undefined}
                commande={resultat.commande}
                ordonnance={ordonnance}
                monture={
                  montureLigne
                    ? produits.find((item) => item.id === montureLigne.produit_id)
                    : undefined
                }
                verre={
                  verreLigne
                    ? produits.find((item) => item.id === verreLigne.produit_id)
                    : undefined
                }
              />
              <FicheAtelierPrintTemplate
                commande={resultat.commande}
                client={client ?? undefined}
                ordonnance={ordonnance}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
