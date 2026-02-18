import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import ProjectOverview from "./pages/projeto/ProjectOverview";
import ProjectDocuments from "./pages/projeto/ProjectDocuments";
import ProjectModeling from "./pages/projeto/ProjectModeling";
import ProjectTrainings from "./pages/projeto/ProjectTrainings";
import ProjectSettings from "./pages/projeto/ProjectSettings";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";

// Admin Pages
import AdminClients from "./pages/admin/AdminClients";
import AdminClientUsers from "./pages/admin/AdminClientUsers";
import AdminClientProjects from "./pages/admin/AdminClientProjects";
import AdminProjectDocuments from "./pages/admin/AdminProjectDocuments";
import AdminProjectTrainings from "./pages/admin/AdminProjectTrainings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } />
            
            {/* Project routes */}
            <Route path="/projeto/:id" element={
              <ProtectedRoute>
                <ProjectOverview />
              </ProtectedRoute>
            } />
            <Route path="/projeto/:id/documentos" element={
              <ProtectedRoute>
                <ProjectDocuments />
              </ProtectedRoute>
            } />
            <Route path="/projeto/:id/modelagem" element={
              <ProtectedRoute>
                <ProjectModeling />
              </ProtectedRoute>
            } />
            <Route path="/projeto/:id/treinamentos" element={
              <ProtectedRoute>
                <ProjectTrainings />
              </ProtectedRoute>
            } />
            <Route path="/projeto/:id/configuracoes" element={
              <ProtectedRoute>
                <ProjectSettings />
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin/empresas" element={
              <ProtectedRoute>
                <AdminClients />
              </ProtectedRoute>
            } />
            <Route path="/admin/empresas/:clientId/usuarios" element={
              <ProtectedRoute>
                <AdminClientUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/empresas/:clientId/projetos" element={
              <ProtectedRoute>
                <AdminClientProjects />
              </ProtectedRoute>
            } />
            <Route path="/admin/projetos/:projectId/documentos" element={
              <ProtectedRoute>
                <AdminProjectDocuments />
              </ProtectedRoute>
            } />
            <Route path="/admin/projetos/:projectId/treinamentos" element={
              <ProtectedRoute>
                <AdminProjectTrainings />
              </ProtectedRoute>
            } />
            
            {/* Support */}
            <Route path="/suporte" element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            } />
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
