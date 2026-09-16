import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import { WorkflowsListPage } from './pages/WorkflowsListPage';
import { WorkflowBuilderPage } from './pages/WorkflowBuilderPage';
import AdminPanelPage from './pages/AdminPanelPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}