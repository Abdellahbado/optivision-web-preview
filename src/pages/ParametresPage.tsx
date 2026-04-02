import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui';
import { Settings, Save, Building, CheckCircle2 } from 'lucide-react';

export function ParametresPage() {
  const [shopName, setShopName] = useState('Ma Boutique Optique');
  const [shopAddress, setShopAddress] = useState('123 Rue Principale, Alger');
  const [shopPhone, setShopPhone] = useState('0555 12 34 56');
  const [shopEmail, setShopEmail] = useState('contact@optivision.dz');
  const [currency, setCurrency] = useState('DZD');
  const [tvaRate, setTvaRate] = useState('0');
  const [saved, setSaved] = useState(false);
  const [lastBackup] = useState('Jamais');

  const handleSave = () => {
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
          <Input
            label="Nom de la boutique"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          <Input
            label="Adresse"
            value={shopAddress}
            onChange={(e) => setShopAddress(e.target.value)}
          />
          <Input
            label="Téléphone"
            value={shopPhone}
            onChange={(e) => setShopPhone(e.target.value)}
          />
          <Input
            label="Email"
            value={shopEmail}
            onChange={(e) => setShopEmail(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Devise"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
            <Input
              label="TVA (%)"
              type="number"
              value={tvaRate}
              onChange={(e) => setTvaRate(e.target.value)}
            />
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
              <span className="text-text-secondary">Base de données</span>
              <span className="text-text-primary font-medium">SQLite</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-secondary">Dernière sauvegarde</span>
              <span className="text-text-primary font-medium">{lastBackup}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
