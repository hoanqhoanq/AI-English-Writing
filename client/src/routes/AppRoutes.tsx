import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// User Layout & Pages
import UserLayout from '../user/layouts/UserLayout';
import Home from '../user/pages/Home';
import PracticePage from '../user/pages/PracticePage';
import AIGeneratorPage from '../user/pages/AIGeneratorPage';
import QuestionBankPage from '../user/pages/QuestionBankPage';
import AnalyticsPage from '../user/pages/AnalyticsPage';
import ProfilePage from '../user/pages/ProfilePage';
import Dashboard from '../user/pages/Dashboard';
import SignIn from '../user/pages/SignIn';
import SignUp from '../user/pages/SignUp';

// Admin Layout & Pages
import AdminLayout from '../admin/layouts/AdminLayout';
import AdminOverviewPage from '../admin/pages/AdminOverviewPage';
import AdminUsersPage from '../admin/pages/AdminUsersPage';
import AdminQuestionsPage from '../admin/pages/AdminQuestionsPage';
import AdminTopicsPage from '../admin/pages/AdminTopicsPage';
import AdminLevelsPage from '../admin/pages/AdminLevelsPage';
import AdminEvaluationsPage from '../admin/pages/AdminEvaluationsPage';
import AdminLoginPage from '../admin/pages/AdminLoginPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ================= USER PORTAL (GIAO DIỆN HỌC VIÊN) ================= */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/generator" element={<AIGeneratorPage />} />
        <Route path="/questions" element={<QuestionBankPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>

      {/* Admin Login standalone (without sidebar) */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* ================= ADMIN PORTAL (GIAO DIỆN QUẢN TRỊ VIÊN) ================= */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="questions" element={<AdminQuestionsPage />} />
        <Route path="topics" element={<AdminTopicsPage />} />
        <Route path="levels" element={<AdminLevelsPage />} />
        <Route path="evaluations" element={<AdminEvaluationsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
