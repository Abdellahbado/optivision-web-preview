import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { useAuthStore } from "@/stores/authStore";
import {
  LoginPage,
  DashboardPage,
  AccueilClientPage,
  RechercheStockPage,
  ClientsPage,
  OrdonnancesPage,
  ProduitsPage,
  CommandesPage,
  FacturesPage,
  RapportsPage,
  ParametresPage,
  SauvegardePage,
  ListeVerresPage,
} from "@/pages";

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Admin-only route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

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
        <Route path="recherche-stock" element={<RechercheStockPage />} />
        <Route path="accueil-client" element={<AccueilClientPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="ordonnances" element={<OrdonnancesPage />} />
        <Route path="produits" element={<ProduitsPage />} />
        <Route path="commandes" element={<CommandesPage />} />
        <Route path="liste-verres" element={<ListeVerresPage />} />
        <Route path="factures" element={<FacturesPage />} />
        <Route path="rapports" element={<RapportsPage />} />
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
      </Route>
    </Routes>
  );
}

export default App;
