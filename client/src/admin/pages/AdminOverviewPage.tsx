import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { SystemStats } from '../../types';
import {
  Users,
  BookOpen,
  Sparkles,
  BarChart3,
  GraduationCap,
  AlertTriangle,
  RefreshCw,
  Plus,
  UserPlus,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

  const levelDistributionData = stats?.questions?.byLevel
    ? Object.entries(stats.questions.byLevel).map(([lvl, count]) => ({
        level: lvl,
        count,
      }))
    : [
        { level: 'A1', count: 4 },
        { level: 'A2', count: 6 },
        { level: 'B1', count: 12 },
        { level: 'B2', count: 8 },
        { level: 'C1', count: 5 },
        { level: 'C2', count: 2 },
      ];

  const errorColors = ['#ef4444', '#f97316', '#eab308', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'];
  const errorDistributionData = stats?.errors?.byType
    ? Object.entries(stats.errors.byType).map(([type, count]) => ({
        name: type,
        value: count,
      }))
    : [
        { name: 'GRAMMAR', value: 14 },
        { name: 'PREPOSITION', value: 9 },
        { name: 'ARTICLE', value: 7 },
        { name: 'TENSE', value: 6 },
        { name: 'SPELLING', value: 4 },
      ];

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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              Phân bố câu hỏi theo cấp độ CEFR
            </h3>
            <Link to="/admin/questions" className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1">
              Xem chi tiết <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="level" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Số lượng câu" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Tỷ lệ các loại lỗi phổ biến do AI phát hiện
            </h3>
            <Link to="/admin/evaluations" className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1">
              Xem lịch sử <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={errorDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {errorDistributionData.map((entry, index) => (
                    <Cell key={`cell-${entry.name || index}`} fill={errorColors[index % errorColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
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
