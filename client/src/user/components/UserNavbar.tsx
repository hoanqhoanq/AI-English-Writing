import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  PenTool,
  Sparkles,
  BarChart3,
  BookOpen,
  Flame,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Zap,
  Shield,
} from 'lucide-react';

export const UserNavbar: React.FC = () => {
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLinks = [
    { name: 'Luyện viết', path: '/practice', icon: PenTool },
    { name: 'AI Sinh đề', path: '/generator', icon: Sparkles },
    { name: 'Ngân hàng câu', path: '/questions', icon: BookOpen },
    { name: 'Thống kê & Lỗi', path: '/analytics', icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleQuickDemoLogin = async () => {
    try {
      await quickLogin('learner');
      setIsProfileOpen(false);
      navigate('/practice');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <PenTool className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 leading-none">
                AI English <span className="text-indigo-600">Writing</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wide uppercase mt-0.5">
                Học viên Luyện Viết
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side: User Stats, Switch to Admin Portal & Profile */}
        <div className="hidden md:flex items-center gap-3">
          {/* Direct link to dedicated Admin Portal */}
          <Link
            to="/admin"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-all"
            title="Truy cập Cổng Quản Trị Hệ Thống"
          >
            <Shield className="h-3.5 w-3.5 text-purple-600" />
            <span>Cổng Quản Trị</span>
          </Link>

          {isAuthenticated && user ? (
            <>
              {/* Streak Counter */}
              <div
                className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                title={`Chuỗi học tập liên tiếp: ${user.streak || 1} ngày`}
              >
                <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-bounce" />
                <span>{user.streak || 1} ngày</span>
              </div>

              {/* Level Badge */}
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
                {user.level || 'B1'}
              </span>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span>Mục tiêu:</span>
                        <span className="font-semibold text-indigo-600">{user.target || 'IELTS'}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        Hồ sơ cá nhân & Mục tiêu
                      </Link>
                      <Link
                        to="/analytics"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <BarChart3 className="h-4 w-4 text-slate-400" />
                        Thống kê học tập
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                title="Đăng nhập tài khoản học viên mẫu có sẵn dữ liệu"
              >
                <Zap className="h-3.5 w-3.5 text-indigo-600" />
                Học viên (Demo)
              </button>

              <Link
                to="/signin"
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 pt-2 pb-6 md:hidden">
          <div className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium ${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-5 w-5 text-indigo-600" />
                  {item.name}
                </Link>
              );
            })}
            <Link
              to="/admin"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-bold text-purple-700 bg-purple-50"
            >
              <Shield className="h-5 w-5 text-purple-600" />
              Cổng Quản Trị (Admin)
            </Link>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span className="font-semibold">{user.name}</span>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                    Trình độ: {user.level}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 py-2 text-sm font-semibold text-rose-700"
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    handleQuickDemoLogin();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-50 py-2.5 text-sm font-semibold text-indigo-700"
                >
                  <Zap className="h-4 w-4" /> Đăng nhập Học viên (Demo)
                </button>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/signin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-center rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white"
                  >
                    Đăng ký
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;
