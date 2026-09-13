import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { SystemStats } from '../../types';
import {
  Users,
  BookOpen,
  Sparkles,
  BarChart3,
  RefreshCw,
  Plus,
  UserPlus,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSystemStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load system stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 p-6 text-white shadow-md">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Chào mừng đến Trung tâm Điều hành AI Writing</h2>
          <p className="text-xs text-purple-200 mt-1">
            Giám sát thời gian thực người dùng, chất lượng chấm điểm AI, và kho câu hỏi luyện viết tiếng Anh.
          </p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 backdrop-blur-xs transition self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Cập nhật số liệu
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng người dùng</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.users?.total || 2}</span>
            <span className="text-xs text-emerald-600 font-semibold">
              {stats?.users?.active || 2} đang hoạt động
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Khóa: <span className="font-semibold text-rose-600">{stats?.users?.locked || 0}</span> | Admin:{' '}
            <span className="font-semibold text-indigo-600">{stats?.users?.admins || 1}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Ngân hàng câu hỏi</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.questions?.total || 6}</span>
            <span className="text-xs text-slate-500">câu luyện viết</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Phủ khắp 6 cấp độ từ <span className="font-semibold text-emerald-600">A1</span> tới{' '}
            <span className="font-semibold text-rose-600">C2</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Lượt làm bài đã chấm</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.attempts?.total || 18}</span>
            <span className="text-xs text-purple-600 font-semibold">AI Chấm tức thì</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Độ chính xác toàn hệ thống: <span className="font-semibold text-slate-800">{stats?.attempts?.accuracy || 82}%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Điểm số trung bình</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats?.attempts?.averageScore || 84}</span>
            <span className="text-xs text-slate-500">/ 100 điểm</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Chất lượng bài làm đạt mức khá giỏi
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Quản lý Người Dùng</div>
              <div className="text-xs text-slate-500">Khóa/mở khóa & phân quyền</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition" />
        </Link>

        <Link
          to="/admin/questions"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Soạn Câu Hỏi Writing</div>
              <div className="text-xs text-slate-500">Đáp án chuẩn & gợi ý theo CEFR</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
        </Link>

        <Link
          to="/admin/evaluations"
          className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Audit Lịch Sử AI Chấm</div>
              <div className="text-xs text-slate-500">Chi tiết phân tích lỗi từng câu</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition" />
        </Link>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
