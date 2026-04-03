import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { Database, Download, Upload, FolderOpen, CheckCircle, AlertTriangle, FileJson, HardDrive, Clock } from 'lucide-react';
import { mockClients, mockOrdonnances, mockProduits, mockCommandes, mockFactures } from '@/lib/mockData';

// Get backup date from localStorage
const BACKUP_KEY = 'optivision_last_backup';

interface BackupData {
  version: string;
  created_at: string;
  data: {
    clients: typeof mockClients;
    ordonnances: typeof mockOrdonnances;
    produits: typeof mockProduits;
    commandes: typeof mockCommandes;
    factures: typeof mockFactures;
  };
}

export function SauvegardePage() {
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    return localStorage.getItem(BACKUP_KEY);
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    
    try {
      // Create backup data structure
      const backupData: BackupData = {
        version: '1.0',
        created_at: new Date().toISOString(),
        data: {
          clients: mockClients,
          ordonnances: mockOrdonnances,
          produits: mockProduits,
          commandes: mockCommandes,
          factures: mockFactures,
        },
      };

      // Convert to JSON
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Generate filename with date
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10);
      const timeStr = date.toTimeString().slice(0, 5).replace(':', 'h');
      const filename = `optivision_backup_${dateStr}_${timeStr}.json`;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Save backup date
      const backupDateStr = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      localStorage.setItem(BACKUP_KEY, backupDateStr);
      setLastBackup(backupDateStr);

      setMessage({ type: 'success', text: `Sauvegarde créée avec succès: ${filename}` });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la création de la sauvegarde' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      // Validate backup structure
      if (!data.version || !data.created_at || !data.data) {
        throw new Error('Format de fichier invalide');
      }

      // Validate data structure
      const requiredKeys = ['clients', 'ordonnances', 'produits', 'commandes', 'factures'];
      for (const key of requiredKeys) {
        if (!(key in data.data)) {
          throw new Error(`Données manquantes: ${key}`);
        }
      }

      // In a real app with SQLite, we would:
      // 1. Clear existing tables
      // 2. Insert all backup data
      // For now with mock data, we'll just show success

      const backupDate = new Date(data.created_at).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Store backup info
      localStorage.setItem('optivision_backup_data', JSON.stringify(data.data));
      
      setMessage({
        type: 'success',
        text: `Sauvegarde du ${backupDate} importée avec succès. Rechargez l'application pour voir les données.`,
      });

    } catch (error) {
      console.error('Import error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erreur lors de l\'importation',
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Calculate data stats
  const stats = {
    clients: mockClients.length,
    ordonnances: mockOrdonnances.length,
    produits: mockProduits.length,
    commandes: mockCommandes.length,
    factures: mockFactures.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Sauvegarde</h1>
        <p className="text-text-secondary mt-1">
          Gérez la sauvegarde de vos données
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-[10px] ${
            message.type === 'success'
              ? 'bg-success-light border border-success/20 text-success'
              : 'bg-danger-light border border-danger/20 text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Backup Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {lastBackup ? (
              <>
                <div className="p-3 rounded-full bg-success-light">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    Dernière sauvegarde
                  </p>
                  <p className="text-sm text-text-secondary">{lastBackup}</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-warning-light">
                  <AlertTriangle className="h-8 w-8 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    Aucune sauvegarde
                  </p>
                  <p className="text-sm text-text-secondary">
                    Créez votre première sauvegarde pour protéger vos données
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Data Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-text-secondary" />
            Données actuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-cream rounded-[10px]">
              <p className="text-2xl font-semibold text-text-primary">{stats.clients}</p>
              <p className="text-xs text-text-secondary">Clients</p>
            </div>
            <div className="text-center p-3 bg-cream rounded-[10px]">
              <p className="text-2xl font-semibold text-text-primary">{stats.ordonnances}</p>
              <p className="text-xs text-text-secondary">Ordonnances</p>
            </div>
            <div className="text-center p-3 bg-cream rounded-[10px]">
              <p className="text-2xl font-semibold text-text-primary">{stats.produits}</p>
              <p className="text-xs text-text-secondary">Produits</p>
            </div>
            <div className="text-center p-3 bg-cream rounded-[10px]">
              <p className="text-2xl font-semibold text-text-primary">{stats.commandes}</p>
              <p className="text-xs text-text-secondary">Commandes</p>
            </div>
            <div className="text-center p-3 bg-cream rounded-[10px]">
              <p className="text-2xl font-semibold text-text-primary">{stats.factures}</p>
              <p className="text-xs text-text-secondary">Factures</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-accent" />
              Créer une sauvegarde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              Exportez toutes vos données dans un fichier JSON. 
              Ce fichier peut être copié sur une clé USB ou envoyé vers le cloud.
            </p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <FileJson className="h-4 w-4" />
              <span>Format: JSON (compatible avec tous les systèmes)</span>
            </div>
            <Button className="w-full" onClick={handleExport} disabled={isExporting}>
              <Database className="h-4 w-4 mr-2" />
              {isExporting ? 'Création en cours...' : 'Créer une sauvegarde'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-warning" />
              Restaurer une sauvegarde
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              Importez un fichier de sauvegarde pour restaurer vos données.
              <span className="text-danger font-medium"> Attention: cette action remplacera toutes les données actuelles.</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleImportClick}
              disabled={isImporting}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              {isImporting ? 'Importation en cours...' : 'Choisir un fichier'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-text-secondary" />
            Conseils
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Effectuez une sauvegarde régulièrement (au moins une fois par semaine)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Conservez plusieurs copies de sauvegarde sur différents supports (clé USB, cloud)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Avant toute restauration, créez une sauvegarde des données actuelles
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Les fichiers de sauvegarde peuvent être ouverts dans un éditeur de texte pour vérification
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
