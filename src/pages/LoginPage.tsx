import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simulate network delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    const result = login(username, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Erreur de connexion');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-accent mb-4">
            <span className="text-white font-bold text-2xl">OV</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">OptiVision</h1>
          <p className="text-text-secondary mt-1">Gestion de magasin d'optique</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary text-center mb-4">
              Connexion
            </h2>

            {error && (
              <div className="p-3 bg-danger-light border border-danger/20 text-danger text-sm rounded">
                {error}
              </div>
            )}

            <Input
              label="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              autoComplete="username"
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-text-muted hover:text-text-secondary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !username || !password}>
              {loading ? (
                'Connexion...'
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 pt-4 border-t border-surface-border">
            <p className="text-xs text-text-muted text-center mb-2">
              Comptes de démonstration:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-cream border border-surface-border">
                <p className="font-medium text-text-primary">Admin</p>
                <p className="text-text-muted">admin / admin123</p>
              </div>
              <div className="p-2 bg-cream border border-surface-border">
                <p className="font-medium text-text-primary">Vendeur</p>
                <p className="text-text-muted">vendeur / vendeur123</p>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-xs text-text-muted text-center mt-4">
          © 2024 OptiVision - Logiciel de gestion d'optique
        </p>
      </div>
    </div>
  );
}
