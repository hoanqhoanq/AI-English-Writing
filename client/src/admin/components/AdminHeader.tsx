import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu } from 'lucide-react';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar, title = 'Bảng Điều Khiển Quản Trị' }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900">{title}</h1>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Service & Evaluation Engine Online</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] font-semibold text-purple-700 uppercase">Super Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
