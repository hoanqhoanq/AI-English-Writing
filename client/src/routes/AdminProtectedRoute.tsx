import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== 'admin') {
      window.location.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-400">Đang kiểm tra quyền truy cập Quản trị viên...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to Admin Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // A non-admin session cannot render the Admin entry point.
  if (user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
