import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import AdminRegistros from "./pages/AdminRegistros";
import AdminRegistroDetail from "./pages/AdminRegistroDetail";
import NotFound from "./pages/NotFound";
import { AuthenticatedRoute, AdminRoute } from "@/components/routeGuards";

const queryClient = new QueryClient();

/** Protege rutas que requieren login (alias local, mismo componente que AuthenticatedRoute) */
const ProtectedRoute = AuthenticatedRoute;

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
          {/*
            CRITICAL-1 fix (sdd-verify): these two routes were previously
            wrapped in AdminRoute, which redirected any operador to
            /dashboard — leaving no panel UI path to the already-correct,
            already-tested backend registros scoping/status-correction/audit
            endpoints. AuthenticatedRoute admits any authenticated user; the
            backend (lib/accessScope.js) remains the sole enforcement
            boundary for what each role can see/do.
          */}
          <Route
            path="/admin/registros"
            element={
              <AuthenticatedRoute>
                <AdminRegistros />
              </AuthenticatedRoute>
            }
          />
          <Route
            path="/admin/registros/:id"
            element={
              <AuthenticatedRoute>
                <AdminRegistroDetail />
              </AuthenticatedRoute>
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
