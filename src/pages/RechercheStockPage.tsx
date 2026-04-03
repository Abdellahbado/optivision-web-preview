import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle, XCircle, ArrowRight, Package } from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';
import { OpticalInput } from '@/components/ui/OpticalInput';
import { formatCurrency } from '@/lib/utils';
import { mockProduits } from '@/lib/mockData';
import type { Produit } from '@/types';

interface PrescriptionSearch {
  od_sphere?: number;
  od_cylindre?: number;
  og_sphere?: number;
  og_cylindre?: number;
}

// Transposition: same lens can be written two ways
function transposeValues(sphere: number, cylinder: number): { sphere: number; cylinder: number } {
  return {
    sphere: sphere + cylinder,
    cylinder: -cylinder,
  };
}

// Check if a lens product can fulfill the prescription
function lensMatchesPrescription(
  product: Produit,
  sphere?: number,
  cylinder?: number,
  includeTransposed = true
): boolean {
  if (!product.verre) return true; // No constraints = matches all

  const sphereMin = product.verre.sphere_min ?? -20;
  const sphereMax = product.verre.sphere_max ?? 20;
  const cylMax = product.verre.cylindre_max ?? 6;

  if (sphere === undefined) return true;

  // Check original values
  const originalFits =
    sphere >= sphereMin &&
    sphere <= sphereMax &&
    (cylinder === undefined || Math.abs(cylinder) <= cylMax);

  if (originalFits) return true;

  // Check transposed values
  if (includeTransposed && cylinder !== undefined) {
    const transposed = transposeValues(sphere, cylinder);
    const transposedFits =
      transposed.sphere >= sphereMin &&
      transposed.sphere <= sphereMax &&
      Math.abs(transposed.cylinder) <= cylMax;
    if (transposedFits) return true;
  }

  return false;
}

export function RechercheStockPage() {
  const [rx, setRx] = useState<PrescriptionSearch>({});
  const [textSearch, setTextSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [includeTransposed, setIncludeTransposed] = useState(true);

  // Filter lenses (VER category)
  const verres = useMemo(() => mockProduits.filter((p) => p.categorie === 'VER' && p.actif), []);

  // Filter montures (MON category)
  const montures = useMemo(() => mockProduits.filter((p) => p.categorie === 'MON' && p.actif), []);

  // Search results for lenses
  const matchingVerres = useMemo(() => {
    let results = [...verres];

    // Text search
    if (textSearch.trim()) {
      const term = textSearch.toLowerCase();
      results = results.filter(
        (p) =>
          p.nom.toLowerCase().includes(term) ||
          p.reference.toLowerCase().includes(term) ||
          p.marque?.toLowerCase().includes(term)
      );
    }

    // Type filter (coating type or verre type)
    if (typeFilter) {
      const filterLower = typeFilter.toLowerCase();
      results = results.filter((p) => {
        const coatingType = p.verre?.coating_type?.toLowerCase() || '';
        const treatments = p.verre?.traitements?.join(' ').toLowerCase() || '';
        const notes = p.notes?.toLowerCase() || '';
        const name = p.nom.toLowerCase();
        const type = p.verre?.type_verre?.toLowerCase() || '';
        return (
          coatingType === filterLower ||
          coatingType.includes(filterLower) ||
          treatments.includes(filterLower) ||
          notes.includes(filterLower) ||
          name.includes(filterLower) ||
          type.includes(filterLower)
        );
      });
    }

    // OD prescription match
    if (rx.od_sphere !== undefined) {
      results = results.filter((p) =>
        lensMatchesPrescription(p, rx.od_sphere, rx.od_cylindre, includeTransposed)
      );
    }

    // OG prescription match (if different from OD)
    if (rx.og_sphere !== undefined) {
      results = results.filter((p) =>
        lensMatchesPrescription(p, rx.og_sphere, rx.og_cylindre, includeTransposed)
      );
    }

    return results;
  }, [verres, textSearch, typeFilter, rx, includeTransposed]);

  // Search results for montures (simple text search)
  const matchingMontures = useMemo(() => {
    if (!textSearch.trim()) return montures.slice(0, 6); // Show first 6 by default
    const term = textSearch.toLowerCase();
    return montures.filter(
      (p) =>
        p.nom.toLowerCase().includes(term) ||
        p.reference.toLowerCase().includes(term) ||
        p.marque?.toLowerCase().includes(term) ||
        p.couleur?.toLowerCase().includes(term)
    );
  }, [montures, textSearch]);

  const hasOdSearch = rx.od_sphere !== undefined;
  const hasOgSearch = rx.og_sphere !== undefined;
  const hasAnySearch = hasOdSearch || hasOgSearch || textSearch.trim() || typeFilter;

  // Check if we found lenses that can work for BOTH eyes
  const canFulfillBothEyes =
    hasOdSearch && hasOgSearch
      ? matchingVerres.some(
          (p) =>
            lensMatchesPrescription(p, rx.od_sphere, rx.od_cylindre, includeTransposed) &&
            lensMatchesPrescription(p, rx.og_sphere, rx.og_cylindre, includeTransposed)
        )
      : matchingVerres.length > 0;

  const clearSearch = () => {
    setRx({});
    setTextSearch('');
    setTypeFilter('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Recherche Stock</h1>
          <p className="text-text-secondary mt-1">
            Vérifier la disponibilité des verres avant de prendre les informations du client
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearSearch}>
            Effacer
          </Button>
          <Link to="/accueil-client">
            <Button>
              Accueil client
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Form */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Search className="h-5 w-5 text-accent" />
          Rechercher par correction
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OD (Right Eye) */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-primary bg-cream px-3 py-1.5 border-l-2 border-accent">
              Œil Droit (OD)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <OpticalInput
                label="Sphère"
                value={rx.od_sphere}
                onChange={(val) => setRx((prev) => ({ ...prev, od_sphere: val }))}
                step={0.25}
                min={-20}
                max={20}
                placeholder="ex: -2.00"
              />
              <OpticalInput
                label="Cylindre"
                value={rx.od_cylindre}
                onChange={(val) => setRx((prev) => ({ ...prev, od_cylindre: val }))}
                step={0.25}
                min={-6}
                max={6}
                placeholder="ex: -1.00"
              />
            </div>
          </div>

          {/* OG (Left Eye) */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-primary bg-cream px-3 py-1.5 border-l-2 border-accent">
              Œil Gauche (OG)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <OpticalInput
                label="Sphère"
                value={rx.og_sphere}
                onChange={(val) => setRx((prev) => ({ ...prev, og_sphere: val }))}
                step={0.25}
                min={-20}
                max={20}
                placeholder="ex: -2.00"
              />
              <OpticalInput
                label="Cylindre"
                value={rx.og_cylindre}
                onChange={(val) => setRx((prev) => ({ ...prev, og_cylindre: val }))}
                step={0.25}
                min={-6}
                max={6}
                placeholder="ex: -1.00"
              />
            </div>
          </div>
        </div>

        {/* Additional filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-surface-border">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Type de traitement
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-surface-border bg-surface focus:outline-none focus:border-accent"
            >
              <option value="">Tous les types</option>
              <optgroup label="Types de traitement (Algérie)">
                <option value="HC">HC (Durci)</option>
                <option value="HMC">HMC (Multi-couche)</option>
                <option value="BB">BB (Blue Block)</option>
                <option value="PEG_HC">PEG HC (Progressif durci)</option>
                <option value="PEB_HC">PEB HC (Prog. bifocal durci)</option>
                <option value="PEG_HMC">PEG HMC (Progressif multi)</option>
                <option value="PEB_HMC">PEB HMC (Prog. bifocal multi)</option>
                <option value="PEG_BLEU_HMC">PEG BLEU HMC (Prog. bleu multi)</option>
                <option value="PEG_BB">PEG BB (Progressif blue block)</option>
              </optgroup>
              <optgroup label="Types de verre">
                <option value="unifocal">Unifocal</option>
                <option value="progressif">Progressif</option>
                <option value="bifocal">Bifocal</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Recherche texte
            </label>
            <Input
              value={textSearch}
              onChange={(e) => setTextSearch(e.target.value)}
              placeholder="Nom, marque, référence..."
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 h-9 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTransposed}
                onChange={(e) => setIncludeTransposed(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm text-text-secondary">Inclure transposition</span>
            </label>
          </div>
        </div>

        {/* Transposition explanation */}
        {hasOdSearch && rx.od_cylindre !== undefined && includeTransposed && (
          <div className="text-xs text-text-muted bg-cream px-3 py-2 border border-surface-border">
            <strong>OD:</strong> {rx.od_sphere! >= 0 ? '+' : ''}
            {rx.od_sphere?.toFixed(2)} / {rx.od_cylindre >= 0 ? '+' : ''}
            {rx.od_cylindre?.toFixed(2)}
            {' ⟺ '}
            {(rx.od_sphere! + rx.od_cylindre) >= 0 ? '+' : ''}
            {(rx.od_sphere! + rx.od_cylindre).toFixed(2)} / {-rx.od_cylindre >= 0 ? '+' : ''}
            {(-rx.od_cylindre).toFixed(2)} (transposé)
          </div>
        )}
      </Card>

      {/* Results Summary */}
      {hasAnySearch && (
        <Card
          className={`p-4 ${
            canFulfillBothEyes
              ? 'bg-success-light border-success/30'
              : 'bg-danger-light border-danger/30'
          }`}
        >
          <div className="flex items-center gap-3">
            {canFulfillBothEyes ? (
              <>
                <CheckCircle className="h-6 w-6 text-success" />
                <div>
                  <p className="font-semibold text-success">Verres disponibles</p>
                  <p className="text-sm text-text-secondary">
                    {matchingVerres.length} verre(s) correspondent à la recherche
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-danger" />
                <div>
                  <p className="font-semibold text-danger">Aucun verre disponible</p>
                  <p className="text-sm text-text-secondary">
                    La correction demandée n'est pas en stock. À commander.
                  </p>
                </div>
              </>
            )}
            {canFulfillBothEyes && (
              <Link to="/accueil-client" className="ml-auto">
                <Button>
                  Continuer avec client
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verres Results */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Verres
            </h2>
            <Badge variant={matchingVerres.length > 0 ? 'success' : 'default'}>
              {matchingVerres.length} trouvé(s)
            </Badge>
          </div>

          {matchingVerres.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">
              {hasAnySearch
                ? 'Aucun verre ne correspond à cette correction'
                : 'Entrez une correction pour rechercher'}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {matchingVerres.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-surface-border hover:bg-cream transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary truncate">{product.nom}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {product.verre?.type_verre && (
                        <Badge variant="info" className="text-[10px] px-1.5 py-0">
                          {product.verre.type_verre}
                        </Badge>
                      )}
                      {product.verre?.indice && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          Indice {product.verre.indice}
                        </Badge>
                      )}
                      {product.verre?.traitements?.slice(0, 2).map((t) => (
                        <Badge key={t} variant="default" className="text-[10px] px-1.5 py-0">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Sph: {product.verre?.sphere_min ?? '?'} à {product.verre?.sphere_max ?? '?'} •
                      Cyl max: ±{product.verre?.cylindre_max ?? '?'}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="font-semibold text-text-primary">
                      {formatCurrency(product.prix_vente)}
                    </p>
                    <p
                      className={`text-xs ${
                        product.quantite > product.stock_minimum
                          ? 'text-success'
                          : product.quantite > 0
                          ? 'text-warning'
                          : 'text-danger'
                      }`}
                    >
                      Stock: {product.quantite}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Montures Results */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              Montures
            </h2>
            <Badge variant={matchingMontures.length > 0 ? 'success' : 'default'}>
              {matchingMontures.length} trouvé(s)
            </Badge>
          </div>

          {matchingMontures.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">Aucune monture trouvée</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {matchingMontures.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-surface-border hover:bg-cream transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary truncate">{product.nom}</p>
                    <p className="text-xs text-text-secondary">
                      {product.marque} • {product.couleur}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="font-semibold text-text-primary">
                      {formatCurrency(product.prix_vente)}
                    </p>
                    <p
                      className={`text-xs ${
                        product.quantite > product.stock_minimum
                          ? 'text-success'
                          : product.quantite > 0
                          ? 'text-warning'
                          : 'text-danger'
                      }`}
                    >
                      Stock: {product.quantite}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
