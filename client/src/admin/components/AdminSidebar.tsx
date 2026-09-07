import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  Users,
  BookOpen,
  Sparkles,
  Layers,
  GraduationCap,
  History,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Tổng quan hệ thống', path: '/admin', icon: BarChart3, exact: true },
    { name: 'Quản lý Người dùng', path: '/admin/users', icon: Users },
    { name: 'Câu hỏi Writing', path: '/admin/questions', icon: BookOpen },
    { name: 'AI Sinh câu hỏi', path: '/admin/ai-generate', icon: Sparkles },
    { name: 'Chủ đề & Ngữ pháp', path: '/admin/topics', icon: Layers },
    { name: 'Cấp độ CEFR', path: '/admin/levels', icon: GraduationCap },
    { name: 'Lịch sử AI Chấm bài', path: '/admin/evaluations', icon: History },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-200 border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Admin Brand */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                ADMIN PORTAL
                <span className="rounded bg-purple-900/80 text-[10px] text-purple-300 font-bold px-1.5 py-0.2">
                  PRO
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">AI English Writing</div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quản trị & Giám sát
          </div>

          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {active && <ChevronRight className="h-3.5 w-3.5 text-purple-200" />}
              </Link>
            );
          })}

        </div>

        {/* Admin User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-700 text-white text-xs font-bold ring-2 ring-purple-400/20">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email || ''}</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-900/50 bg-rose-950/30 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            Đăng xuất Admin
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
