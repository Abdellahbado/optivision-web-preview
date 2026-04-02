import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { Database, Download, Upload, FolderOpen, CheckCircle, AlertTriangle } from 'lucide-react';

export function SauvegardePage() {
  const [lastBackup] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Sauvegarde</h1>
        <p className="text-text-secondary mt-1">
          Gérez la sauvegarde de vos données
        </p>
      </div>

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
              Exportez toutes vos données dans un fichier de sauvegarde. 
              Ce fichier peut être utilisé pour restaurer vos données ultérieurement.
            </p>
            <Button className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Créer une sauvegarde
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
            <Button variant="outline" className="w-full">
              <FolderOpen className="h-4 w-4 mr-2" />
              Choisir un fichier
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Conseils</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Effectuez une sauvegarde régulièrement (au moins une fois par semaine)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Conservez plusieurs copies de sauvegarde sur différents supports
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              Avant toute restauration, créez une sauvegarde des données actuelles
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
