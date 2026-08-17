import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import AdminOverviewPage from './pages/AdminOverviewPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminQuestionsPage from './pages/AdminQuestionsPage';
import AdminTopicsPage from './pages/AdminTopicsPage';
import AdminLevelsPage from './pages/AdminLevelsPage';
import AdminEvaluationsPage from './pages/AdminEvaluationsPage';
import AdminLoginPage from './pages/AdminLoginPage';
import '../index.css';

const AdminApp: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="questions" element={<AdminQuestionsPage />} />
        <Route path="topics" element={<AdminTopicsPage />} />
        <Route path="levels" element={<AdminLevelsPage />} />
        <Route path="evaluations" element={<AdminEvaluationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('admin-root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
