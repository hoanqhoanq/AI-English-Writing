import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// User Layout & Pages
import UserLayout from '../user/layouts/UserLayout';
import Home from '../user/pages/Home';
import PracticePage from '../user/pages/PracticePage';
import QuestionBankPage from '../user/pages/QuestionBankPage';
import WritingQuestionPage from '../user/pages/WritingQuestionPage';
import AnalyticsPage from '../user/pages/AnalyticsPage';
import ProfilePage from '../user/pages/ProfilePage';
import Dashboard from '../user/pages/Dashboard';
import SignIn from '../user/pages/SignIn';
import SignUp from '../user/pages/SignUp';
import LearningHomePage from '../user/pages/LearningHomePage';
import LearningTopicPage from '../user/pages/LearningTopicPage';
import LearningProgressPage from '../user/pages/LearningProgressPage';
import ParagraphWritingPage from '../user/pages/ParagraphWritingPage';
import ParagraphTopicPage from '../user/pages/ParagraphTopicPage';
import ProtectedRoute from './ProtectedRoute';
import UserRoute from './UserRoute';
import RootRedirect from '../pages/RootRedirect';

// Note: /admin* is never served by this bundle — the server (src/app.ts)
// routes any /admin* request to the separate admin.html bundle
// (admin/main.tsx), which has its own independent auth session. This router
// must not define any /admin route itself, or a client-side navigation to
// /admin from within the User portal would render Admin UI inside this bundle.

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/signin" element={<Navigate to="/login" replace />} />
      <Route path="/signup" element={<SignUp />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<UserRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/questions" element={<QuestionBankPage />} />
            <Route path="/writing/question/:questionId" element={<WritingQuestionPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/learning" element={<LearningHomePage />} />
            <Route path="/learning/progress" element={<LearningProgressPage />} />
            <Route path="/learning/:category/:slug" element={<LearningTopicPage />} />
            <Route path="/paragraph-writing" element={<ParagraphWritingPage />} />
            <Route path="/paragraph-writing/:topicId" element={<ParagraphTopicPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
