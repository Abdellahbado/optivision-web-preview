import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { useAuthStore } from "@/stores/authStore";
import {
  ArgentPage,
  AtelierPage,
  ClientDetailPage,
  ClientsPage,
  DashboardPage,
  LoginPage,
  ParametresPage,
  RapportsPage,
  SauvegardePage,
  StockPage,
  VentePage,
} from "@/pages";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Six destinations, plus la fiche client et les pages d'administration.
 * Les anciens chemins redirigent pour ne casser aucun raccourci.
 */
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="vente" element={<VentePage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="commandes" element={<AtelierPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="argent" element={<ArgentPage />} />

        {/* Anciens chemins */}
        <Route path="accueil-client" element={<Navigate to="/vente" replace />} />
        <Route path="produits" element={<Navigate to="/stock" replace />} />
        <Route path="recherche-stock" element={<Navigate to="/stock" replace />} />
        <Route path="ordonnances" element={<Navigate to="/clients" replace />} />
        <Route path="liste-verres" element={<Navigate to="/commandes" replace />} />
        <Route path="factures" element={<Navigate to="/argent" replace />} />

        <Route
          path="rapports"
          element={
            <AdminRoute>
              <RapportsPage />
            </AdminRoute>
          }
        />
        <Route
          path="parametres"
          element={
            <AdminRoute>
              <ParametresPage />
            </AdminRoute>
          }
        />
        <Route
          path="sauvegarde"
          element={
            <AdminRoute>
              <SauvegardePage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
