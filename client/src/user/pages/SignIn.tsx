import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PenTool, Lock, Mail, Zap, AlertCircle } from 'lucide-react';

export const SignIn: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/practice');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đăng nhập không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'learner' | 'admin') => {
    setIsLoading(true);
    try {
      await quickLogin(role);
      navigate('/practice');
    } catch (err: any) {
      setError('Đăng nhập nhanh thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <PenTool className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập tài khoản</h1>
          <p className="text-xs text-slate-500">
            Truy cập nền tảng luyện viết tiếng Anh thông minh cùng AI
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Switcher */}
        <div className="mb-6 rounded-2xl bg-indigo-50/70 p-3.5 border border-indigo-100 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-indigo-600" />
            Đăng nhập 1-click (Demo có sẵn dữ liệu)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('learner')}
              disabled={isLoading}
              className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm border border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              👤 Học viên mẫu
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={isLoading}
              className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm border border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              🛡️ Quản trị viên
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/signup" className="font-bold text-indigo-600 hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
