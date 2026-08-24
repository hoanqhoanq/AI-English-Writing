import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout from './layouts/AdminLayout';
import AdminOverviewPage from './pages/AdminOverviewPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminQuestionsPage from './pages/AdminQuestionsPage';
import AdminTopicsPage from './pages/AdminTopicsPage';
import AdminLevelsPage from './pages/AdminLevelsPage';
import AdminEvaluationsPage from './pages/AdminEvaluationsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminProtectedRoute from '../routes/AdminProtectedRoute';
import AdminAIGeneratePage from './pages/AdminAIGeneratePage';
import '../index.css';

const queryClient = new QueryClient();

const AdminApp: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="questions" element={<AdminQuestionsPage />} />
          <Route path="ai-generate" element={<AdminAIGeneratePage />} />
          <Route path="topics" element={<AdminTopicsPage />} />
          <Route path="levels" element={<AdminLevelsPage />} />
          <Route path="evaluations" element={<AdminEvaluationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

ReactDOM.createRoot(document.getElementById('admin-root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
