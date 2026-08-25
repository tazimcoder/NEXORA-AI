import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkflowsListPage } from './pages/WorkflowsListPage';
import { WorkflowBuilderPage } from './pages/WorkflowBuilderPage';
import AdminPanelPage from './pages/AdminPanelPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/workflows" element={<WorkflowsListPage />} />
        <Route path="/workflows/:id" element={<WorkflowBuilderPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
        <Route path="*" element={<Navigate to="/workflows" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

