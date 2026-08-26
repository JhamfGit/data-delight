import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import AdminRegistros from "./pages/AdminRegistros";
import AdminRegistroDetail from "./pages/AdminRegistroDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Verifica que haya un token JWT válido (existencia, no expiración)
const isAuthenticated = () => !!localStorage.getItem("token");
const isAdmin = () => localStorage.getItem("userRol") === "admin";

/** Protege rutas que requieren login */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  return <>{children}</>;
};

/** Protege rutas que requieren rol admin */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) return <Navigate to="/" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/registros"
            element={
              <AdminRoute>
                <AdminRegistros />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/registros/:id"
            element={
              <AdminRoute>
                <AdminRegistroDetail />
              </AdminRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
