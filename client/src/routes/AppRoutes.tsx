import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// User Layout & Pages
import UserLayout from '../user/layouts/UserLayout';
import Home from '../user/pages/Home';
import PracticePage from '../user/pages/PracticePage';
import QuestionBankPage from '../user/pages/QuestionBankPage';
import AnalyticsPage from '../user/pages/AnalyticsPage';
import ProfilePage from '../user/pages/ProfilePage';
import Dashboard from '../user/pages/Dashboard';
import SignIn from '../user/pages/SignIn';
import SignUp from '../user/pages/SignUp';
import JourneyPage from '../user/pages/JourneyPage';
import JourneyChapterPage from '../user/pages/JourneyChapterPage';
import ParagraphWritingPage from '../user/pages/ParagraphWritingPage';
import ParagraphTopicPage from '../user/pages/ParagraphTopicPage';

// Admin Layout & Pages
import AdminLayout from '../admin/layouts/AdminLayout';
import AdminOverviewPage from '../admin/pages/AdminOverviewPage';
import AdminUsersPage from '../admin/pages/AdminUsersPage';
import AdminQuestionsPage from '../admin/pages/AdminQuestionsPage';
import AdminTopicsPage from '../admin/pages/AdminTopicsPage';
import AdminLevelsPage from '../admin/pages/AdminLevelsPage';
import AdminEvaluationsPage from '../admin/pages/AdminEvaluationsPage';
import AdminLoginPage from '../admin/pages/AdminLoginPage';
import AdminAIGeneratePage from '../admin/pages/AdminAIGeneratePage';
import AdminParagraphTopicsPage from '../admin/pages/AdminParagraphTopicsPage';
import ProtectedRoute from './ProtectedRoute';
import UserRoute from './UserRoute';
import AdminRoute from './AdminRoute';
import RootRedirect from '../pages/RootRedirect';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/signin" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<UserRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/questions" element={<QuestionBankPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/journey" element={<JourneyPage />} />
            <Route path="/journey/:grammarTopicId" element={<JourneyChapterPage />} />
            <Route path="/paragraph-writing" element={<ParagraphWritingPage />} />
            <Route path="/paragraph-writing/:topicId" element={<ParagraphTopicPage />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/questions" element={<AdminQuestionsPage />} />
            <Route path="/admin/ai-generate" element={<AdminAIGeneratePage />} />
            <Route path="/admin/topics" element={<AdminTopicsPage />} />
            <Route path="/admin/paragraph-topics" element={<AdminParagraphTopicsPage />} />
            <Route path="/admin/levels" element={<AdminLevelsPage />} />
            <Route path="/admin/evaluations" element={<AdminEvaluationsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
