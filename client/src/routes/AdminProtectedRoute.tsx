import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  // Not authenticated, or authenticated but not an admin: both cases stay
  // entirely within the Admin portal — never navigate to a User portal path.
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
