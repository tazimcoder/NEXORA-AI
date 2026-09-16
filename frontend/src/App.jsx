import React, { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Zap } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded Page Chunks for Ultra-Fast Initial Page Loads
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const WorkflowsListPage = lazy(() => import('./pages/WorkflowsListPage').then(m => ({ default: m.WorkflowsListPage })));
const WorkflowBuilderPage = lazy(() => import('./pages/WorkflowBuilderPage').then(m => ({ default: m.WorkflowBuilderPage })));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));

// Ultra-fast glowing loading spinner
const PageLoader = () => (
  <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center gap-4 text-white">
    <div className="relative p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
      <Zap className="w-8 h-8 text-cyan-400 animate-bounce" />
    </div>
    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
      <span>Loading NEXORA Engine...</span>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Login / Register Page */}
          <Route path="/login" element={<AuthPage />} />

          {/* Protected User Workflows Routes */}
          <Route
            path="/workflows"
            element={
              <ProtectedRoute>
                <WorkflowsListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/workflows/:id"
            element={
              <ProtectedRoute>
                <WorkflowBuilderPage />
              </ProtectedRoute>
            }
          />

          {/* Strictly Protected Admin Panel Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanelPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}