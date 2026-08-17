import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui';
import { Settings, Save, Building, CheckCircle2 } from 'lucide-react';
import { useAppDataStore } from '@/stores/appDataStore';

/**
 * Ce qui est saisi ici s'imprime en haut des factures et des fiches d'atelier.
 */
export function ParametresPage() {
  const parametres = useAppDataStore((state) => state.parametres);
  const updateParametres = useAppDataStore((state) => state.updateParametres);
  const [brouillon, setBrouillon] = useState(parametres);
  const [saved, setSaved] = useState(false);
  const champ = (cle: keyof typeof parametres) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => setBrouillon((prev) => ({ ...prev, [cle]: event.target.value }));

  const handleSave = () => {
    updateParametres({ ...brouillon, tva: Number(brouillon.tva) || 0 });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Paramètres</h1>
        <p className="text-text-secondary mt-1">
          Configurez votre application
        </p>
      </div>

      {/* Shop Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-accent" />
            Informations de la boutique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary -mt-1">
            Ces informations s'impriment en haut de vos factures et fiches d'atelier.
          </p>
          <Input label="Nom du magasin" value={brouillon.nom_magasin} onChange={champ('nom_magasin')} />
          <Input label="Spécialité (sous le nom)" value={brouillon.specialite} onChange={champ('specialite')} />
          <Input label="Adresse" value={brouillon.adresse} onChange={champ('adresse')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Téléphone" value={brouillon.telephone} onChange={champ('telephone')} />
            <Input label="Email" value={brouillon.email} onChange={champ('email')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="N.I.F." value={brouillon.nif} onChange={champ('nif')} />
            <Input label="N° Article" value={brouillon.numero_article} onChange={champ('numero_article')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Devise" value={brouillon.devise} onChange={champ('devise')} />
            <Input label="TVA (%)" type="number" value={brouillon.tva} onChange={champ('tva')} />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
            {saved && (
              <span className="text-sm text-success flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Paramètres enregistrés
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Préférences métier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-[10px] border border-surface-border px-4 py-3">
            <span className="text-sm text-text-secondary">Langue de l'interface</span>
            <Badge>Français</Badge>
          </div>
          <div className="flex items-center justify-between rounded-[10px] border border-surface-border px-4 py-3">
            <span className="text-sm text-text-secondary">Format monétaire</span>
            <Badge variant="info">DA (DZD)</Badge>
          </div>
          <div className="flex items-center justify-between rounded-[10px] border border-surface-border px-4 py-3">
            <span className="text-sm text-text-secondary">Profil</span>
            <Badge variant="success">Single-user</Badge>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-text-secondary">Version</span>
              <span className="text-text-primary font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-secondary">Version finale</span>
              <span className="text-text-primary font-medium">Application Windows + SQLite</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-secondary">Mode</span>
              <span className="text-text-primary font-medium">Démonstration (navigateur)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
