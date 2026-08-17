import React, { useState, useEffect, useId } from 'react';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import {
  AdminUser,
  WritingQuestion,
  Topic,
  GrammarTopic,
  CefrLevelDef,
  SystemStats,
  AdminEvaluationRecord,
} from '../types';
import {
  Users,
  BookOpen,
  Layers,
  GraduationCap,
  BarChart3,
  History,
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Eye,
  Check,
  X,
  UserPlus,
  LogIn,
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

type AdminTab = 'overview' | 'users' | 'questions' | 'topics' | 'levels' | 'evaluations';

export const AdminDashboard: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [questions, setQuestions] = useState<WritingQuestion[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [grammars, setGrammars] = useState<GrammarTopic[]>([]);
  const [levels, setLevels] = useState<CefrLevelDef[]>([]);
  const [evaluations, setEvaluations] = useState<AdminEvaluationRecord[]>([]);

  // Search & Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'admin'>('all');

  const [questionSearch, setQuestionSearch] = useState('');
  const [questionLevelFilter, setQuestionLevelFilter] = useState('All');
  const [questionTopicFilter, setQuestionTopicFilter] = useState('All');

  const [evalStatusFilter, setEvalStatusFilter] = useState('All');
  const [evalLevelFilter, setEvalLevelFilter] = useState('All');

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<WritingQuestion> | null>(null);

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Partial<Topic> | null>(null);

  const [isGrammarModalOpen, setIsGrammarModalOpen] = useState(false);
  const [editingGrammar, setEditingGrammar] = useState<Partial<GrammarTopic> | null>(null);

  const [selectedEvaluation, setSelectedEvaluation] = useState<AdminEvaluationRecord | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData, qData, topicsData, gData, levelsData, evalData] = await Promise.all([
        adminService.getSystemStats().catch(() => null),
        adminService.getUsers().catch(() => []),
        adminService.getAdminQuestions().catch(() => ({ questions: [] })),
        adminService.getTopics().catch(() => []),
        adminService.getGrammars().catch(() => []),
        adminService.getLevels().catch(() => []),
        adminService.getEvaluations().catch(() => ({ attempts: [] })),
      ]);

      if (statsData) setStats(statsData);
      setUsers(usersData);
      setQuestions(qData.questions || []);
      setTopics(topicsData);
      setGrammars(gData);
      setLevels(levelsData);
      setEvaluations(evalData.attempts || []);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      showNotification('Không thể tải toàn bộ dữ liệu quản trị', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for User Management
  const handleToggleUserStatus = async (userId: string, currentStatus: boolean, email: string) => {
    try {
      const updated = await adminService.toggleUserStatus(userId);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isActive: updated.isActive } : u)));
      showNotification(`Đã ${updated.isActive ? 'mở khóa' : 'khóa'} tài khoản ${email}`);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      if (editingUser._id) {
        const updated = await adminService.updateUser(editingUser._id, editingUser);
        setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
        showNotification('Cập nhật người dùng thành công');
      } else {
        const created = await adminService.createUser({
          name: editingUser.name || 'Học viên mới',
          email: editingUser.email || '',
          password: 'Password123!',
          role: editingUser.role || 'user',
          level: editingUser.level || 'B1',
          target: editingUser.target || 'IELTS',
        });
        setUsers((prev) => [created, ...prev]);
        showNotification('Tạo người dùng mới thành công');
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Không thể lưu người dùng', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${name}"?`)) return;
    try {
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showNotification(`Đã xóa tài khoản ${name}`);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Không thể xóa', 'error');
    }
  };

  // Handlers for Question Management
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    try {
      if (editingQuestion._id) {
        const updated = await adminService.updateQuestion(editingQuestion._id, editingQuestion);
        setQuestions((prev) => prev.map((q) => (q._id === updated._id ? updated : q)));
        showNotification('Cập nhật câu hỏi thành công');
      } else {
        const created = await adminService.createQuestion(editingQuestion);
        setQuestions((prev) => [created, ...prev]);
        showNotification('Tạo câu hỏi mới thành công');
      }
      setIsQuestionModalOpen(false);
      setEditingQuestion(null);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Không thể lưu câu hỏi', 'error');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await adminService.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      showNotification('Đã xóa câu hỏi');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Không thể xóa câu hỏi', 'error');
    }
  };

  // Handlers for Topic Management
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    try {
      if (editingTopic._id) {
        const updated = await adminService.updateTopic(editingTopic._id, editingTopic);
        setTopics((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
        showNotification('Cập nhật chủ đề thành công');
      } else {
        const created = await adminService.createTopic(editingTopic);
        setTopics((prev) => [...prev, created]);
        showNotification('Tạo chủ đề thành công');
      }
      setIsTopicModalOpen(false);
      setEditingTopic(null);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi lưu chủ đề', 'error');
    }
  };

  const handleDeleteTopic = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chủ đề "${name}"?`)) return;
    try {
      await adminService.deleteTopic(id);
      setTopics((prev) => prev.filter((t) => t._id !== id));
      showNotification(`Đã xóa chủ đề ${name}`);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Không thể xóa chủ đề', 'error');
    }
  };

  // Handlers for Grammar Management
  const handleSaveGrammar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrammar) return;
    try {
      if (editingGrammar._id) {
        const updated = await adminService.updateGrammar(editingGrammar._id, editingGrammar);
        setGrammars((prev) => prev.map((g) => (g._id === updated._id ? updated : g)));
        showNotification('Cập nhật ngữ pháp thành công');
      } else {
        const created = await adminService.createGrammar(editingGrammar);
        setGrammars((prev) => [...prev, created]);
        showNotification('Tạo chủ điểm ngữ pháp thành công');
      }
      setIsGrammarModalOpen(false);
      setEditingGrammar(null);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Lỗi lưu ngữ pháp', 'error');
    }
  };

  const handleDeleteGrammar = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${name}"?`)) return;
    try {
      await adminService.deleteGrammar(id);
      setGrammars((prev) => prev.filter((g) => g._id !== id));
      showNotification(`Đã xóa ngữ pháp ${name}`);
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Không thể xóa ngữ pháp', 'error');
    }
  };

  // Filters calculation
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus =
      userStatusFilter === 'all'
        ? true
        : userStatusFilter === 'active'
        ? u.isActive !== false
        : u.isActive === false;
    const matchesRole = userRoleFilter === 'all' ? true : u.role === userRoleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.vietnameseSentence.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.referenceAnswer.toLowerCase().includes(questionSearch.toLowerCase());
    const matchesLevel = questionLevelFilter === 'All' ? true : q.level === questionLevelFilter;
    const matchesTopic = questionTopicFilter === 'All' ? true : q.topic === questionTopicFilter;
    return matchesSearch && matchesLevel && matchesTopic;
  });

  const filteredEvaluations = evaluations.filter((ev) => {
    const matchesStatus = evalStatusFilter === 'All' ? true : ev.status === evalStatusFilter;
    const matchesLevel = evalLevelFilter === 'All' ? true : ev.level === evalLevelFilter;
    return matchesStatus && matchesLevel;
  });

  // Chart data
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
        { name: 'GRAMMAR', value: 12 },
        { name: 'PREPOSITION', value: 8 },
        { name: 'ARTICLE', value: 6 },
        { name: 'TENSE', value: 5 },
        { name: 'SPELLING', value: 3 },
      ];

  return (
    <div className="space-y-6">
      {/* Admin Notice / Quick Switch Banner if not logged in as admin */}
      {user?.role !== 'admin' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950">Chế độ xem Quản Trị Viên (Admin View)</h4>
              <p className="text-xs text-amber-800">
                Bạn đang đăng nhập bằng tài khoản học viên. Nhấn nút bên cạnh để chuyển sang quyền Quản trị viên mẫu (admin@example.com).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await quickLogin('admin');
              await loadData();
              showNotification('Đã đăng nhập quyền Admin thành công!');
            }}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-sm"
          >
            <LogIn className="h-4 w-4" />
            Đăng nhập quyền Admin
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Hệ Thống Quản Trị (Admin Control Center)
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Quản lý người dùng, ngân hàng câu hỏi Writing, chủ đề, cấp độ CEFR và giám sát AI Evaluation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-medium transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {[
          { id: 'overview', label: 'Tổng quan hệ thống', icon: BarChart3 },
          { id: 'users', label: `Người dùng (${users.length})`, icon: Users },
          { id: 'questions', label: `Câu hỏi Writing (${questions.length})`, icon: BookOpen },
          { id: 'topics', label: `Chủ đề & Ngữ pháp (${topics.length})`, icon: Layers },
          { id: 'levels', label: 'Cấp độ CEFR (A1-C2)', icon: GraduationCap },
          { id: 'evaluations', label: `Lịch sử AI Chấm bài (${evaluations.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SYSTEM OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Tổng người dùng</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats?.users?.total || users.length}</span>
                <span className="text-xs text-emerald-600 font-semibold">
                  {stats?.users?.active ?? users.filter((u) => u.isActive !== false).length} đang hoạt động
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Khóa: <span className="font-semibold text-rose-600">{stats?.users?.locked ?? users.filter((u) => u.isActive === false).length}</span> | 
                Admin: <span className="font-semibold text-indigo-600">{stats?.users?.admins ?? users.filter((u) => u.role === 'admin').length}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Ngân hàng câu hỏi</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats?.questions?.total || questions.length}</span>
                <span className="text-xs text-slate-500">câu luyện viết</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Phủ khắp 6 cấp độ từ <span className="font-semibold text-emerald-600">A1</span> tới <span className="font-semibold text-rose-600">C2</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Lượt làm bài đã chấm</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats?.attempts?.total || evaluations.length}</span>
                <span className="text-xs text-purple-600 font-semibold">AI Chấm tức thì</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Độ chính xác toàn hệ thống: <span className="font-semibold text-slate-800">{stats?.attempts?.accuracy || 78}%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Điểm số trung bình</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats?.attempts?.averageScore || 82}</span>
                <span className="text-xs text-slate-500">/ 100 điểm</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Chất lượng bài làm đạt mức khá giỏi
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Questions per CEFR level */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-600" />
                Phân bố câu hỏi theo cấp độ CEFR
              </h3>
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
                    <Bar dataKey="count" name="Số lượng câu" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Errors Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Tỷ lệ các loại lỗi phổ biến do AI phát hiện
              </h3>
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

          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Thao tác nhanh cho Quản trị viên</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingQuestion({
                    vietnameseSentence: '',
                    referenceAnswer: '',
                    alternativeAnswers: [],
                    level: 'B1',
                    topic: 'Daily Life',
                    grammarTopic: 'General',
                    difficulty: 'medium',
                    keywords: [],
                  });
                  setIsQuestionModalOpen(true);
                }}
                className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-white p-4 text-left hover:border-indigo-400 hover:shadow-sm transition"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Thêm câu hỏi Writing mới</div>
                  <div className="text-[11px] text-slate-500">Soạn đề & đáp án mẫu chuẩn</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingUser({
                    name: '',
                    email: '',
                    role: 'user',
                    level: 'B1',
                    target: 'IELTS',
                  });
                  setIsUserModalOpen(true);
                }}
                className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-left hover:border-emerald-400 hover:shadow-sm transition"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Tạo người dùng mới</div>
                  <div className="text-[11px] text-slate-500">Cấp tài khoản học viên / admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTopic({ name: '', description: '', icon: 'BookOpen', order: topics.length + 1 });
                  setIsTopicModalOpen(true);
                }}
                className="flex items-center gap-3 rounded-xl border border-purple-200 bg-white p-4 text-left hover:border-purple-400 hover:shadow-sm transition"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">Thêm chủ đề mới</div>
                  <div className="text-[11px] text-slate-500">Mở rộng danh mục bài học</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT & LOCK/UNLOCK */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Bị khóa</option>
              </select>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="user">Học viên (User)</option>
                <option value="admin">Quản trị (Admin)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingUser({
                  name: '',
                  email: '',
                  role: 'user',
                  level: 'B1',
                  target: 'IELTS',
                });
                setIsUserModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
            >
              <UserPlus className="h-4 w-4" />
              Thêm người dùng
            </button>
          </div>

          {/* User Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Người dùng</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Trình độ</th>
                    <th className="px-4 py-3">Mục tiêu</th>
                    <th className="px-4 py-3">Bài đã làm</th>
                    <th className="px-4 py-3">Điểm TB</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Không tìm thấy người dùng phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isActive = u.isActive !== false;
                      return (
                        <tr key={u._id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{u.name}</div>
                                <div className="text-[11px] text-slate-400">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role === 'admin' ? 'Admin' : 'Học viên'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                              {u.level || 'B1'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{u.target || 'IELTS'}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{u.totalAttempts || 0}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {u.averageScore ? `${u.averageScore} đ` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <Check className="h-3 w-3" /> Hoạt động
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3" /> Bị khóa
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Lock / Unlock button */}
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u._id, isActive, u.email)}
                                title={isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                                className={`rounded-lg p-1.5 text-xs font-semibold transition ${
                                  isActive
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </button>

                              {/* Edit button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(u);
                                  setIsUserModalOpen(true);
                                }}
                                title="Chỉnh sửa thông tin"
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u._id, u.name)}
                                title="Xóa tài khoản"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WRITING QUESTIONS MANAGEMENT */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm câu tiếng Việt hoặc tiếng Anh..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <select
                value={questionLevelFilter}
                onChange={(e) => setQuestionLevelFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="All">Tất cả cấp độ</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingQuestion({
                  vietnameseSentence: '',
                  referenceAnswer: '',
                  alternativeAnswers: [],
                  level: 'B1',
                  topic: 'Daily Life',
                  grammarTopic: 'General',
                  difficulty: 'medium',
                  keywords: [],
                });
                setIsQuestionModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              Thêm câu hỏi mới
            </button>
          </div>

          {/* Question List */}
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
                Không tìm thấy câu hỏi nào phù hợp với bộ lọc
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div
                  key={q._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                          {q.level}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {q.topic}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            q.difficulty === 'easy'
                              ? 'bg-emerald-50 text-emerald-700'
                              : q.difficulty === 'medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-900">{q.vietnameseSentence}</p>
                      <p className="text-xs font-medium text-indigo-900 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                        <span className="font-semibold text-indigo-700">Đáp án chuẩn:</span> {q.referenceAnswer}
                      </p>

                      {q.alternativeAnswers && q.alternativeAnswers.length > 0 && (
                        <div className="text-[11px] text-slate-500">
                          <span className="font-semibold">Cách diễn đạt khác:</span>{' '}
                          {q.alternativeAnswers.join(' • ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestion(q);
                          setIsQuestionModalOpen(true);
                        }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q._id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TOPICS & GRAMMAR MANAGEMENT */}
      {activeTab === 'topics' && (
        <div className="space-y-6">
          {/* Topics Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                Danh mục Chủ đề bài viết (Topics)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingTopic({ name: '', description: '', icon: 'BookOpen', order: topics.length + 1 });
                  setIsTopicModalOpen(true);
                }}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm chủ đề
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topics.map((t) => (
                <div key={t._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Thứ tự: {t.order || 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{t.description || 'Không có mô tả'}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTopic(t);
                        setIsTopicModalOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(t._id, t.name)}
                      className="rounded-lg p-1.5 text-xs text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grammar Topics Section */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600" />
                Chủ điểm Ngữ pháp trọng tâm (Grammar Focus)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingGrammar({ name: '', description: '', level: 'All', order: grammars.length + 1 });
                  setIsGrammarModalOpen(true);
                }}
                className="flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm ngữ pháp
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {grammars.map((g) => (
                <div key={g._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">{g.name}</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                        {g.level || 'All'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{g.description || 'Không có mô tả'}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGrammar(g);
                        setIsGrammarModalOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGrammar(g._id, g.name)}
                      className="rounded-lg p-1.5 text-xs text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CEFR LEVEL MANAGEMENT */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-indigo-900">
            <h3 className="font-bold text-sm">Khung chuẩn năng lực ngôn ngữ Châu Âu (CEFR Framework)</h3>
            <p className="text-xs text-indigo-700 mt-1">
              Hệ thống chia làm 6 bậc năng lực chuẩn (A1, A2, B1, B2, C1, C2) với tiêu chí vốn từ, cấu trúc ngữ pháp và mục tiêu luyện viết riêng biệt.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levels.map((lvl) => (
              <div key={lvl.code} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-lg shadow-sm">
                    {lvl.code}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                    {lvl.questionCount} câu hỏi
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{lvl.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{lvl.description}</p>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium text-slate-400">Vốn từ mục tiêu:</span>
                    <span className="font-bold text-slate-800">{lvl.targetVocab}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium text-slate-400">Học viên cấp độ:</span>
                    <span className="font-bold text-indigo-600">{lvl.usersCount} người</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium text-slate-400">Mục tiêu ngày:</span>
                    <span className="font-bold text-emerald-600">{lvl.recommendedDaily} câu/ngày</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Trọng tâm ngữ pháp:</span> {lvl.grammarFocus}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AI EVALUATION AUDIT HISTORY */}
      {activeTab === 'evaluations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={evalStatusFilter}
                onChange={(e) => setEvalStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="All">Tất cả kết quả chấm</option>
                <option value="correct">Chính xác (Correct)</option>
                <option value="partially_correct">Đúng một phần (Partial)</option>
                <option value="incorrect">Chưa đúng (Incorrect)</option>
              </select>

              <select
                value={evalLevelFilter}
                onChange={(e) => setEvalLevelFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="All">Tất cả trình độ</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>

            <span className="text-xs text-slate-500">
              Tổng số lượt chấm: <strong className="text-slate-800">{filteredEvaluations.length}</strong>
            </span>
          </div>

          {/* Evaluations Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Học viên</th>
                    <th className="px-4 py-3">Đề bài (Tiếng Việt)</th>
                    <th className="px-4 py-3">Câu học viên viết</th>
                    <th className="px-4 py-3">Trình độ</th>
                    <th className="px-4 py-3">Điểm AI</th>
                    <th className="px-4 py-3">Kết quả</th>
                    <th className="px-4 py-3 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có lịch sử chấm bài nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredEvaluations.map((ev) => (
                      <tr key={ev._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{ev.userName || 'Học viên'}</div>
                          <div className="text-[11px] text-slate-400">{ev.userEmail || 'user@example.com'}</div>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate text-slate-900" title={ev.vietnameseSentence}>
                          {ev.vietnameseSentence}
                        </td>
                        <td className="px-4 py-3 max-w-[240px] truncate font-medium text-slate-800" title={ev.userAnswer}>
                          {ev.userAnswer}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                            {ev.level || 'B1'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs ${
                              ev.finalScore >= 85
                                ? 'bg-emerald-50 text-emerald-700'
                                : ev.finalScore >= 60
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {ev.finalScore} / 100
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              ev.status === 'correct'
                                ? 'bg-emerald-50 text-emerald-700'
                                : ev.status === 'partially_correct'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {ev.status === 'correct'
                              ? 'Chính xác'
                              : ev.status === 'partially_correct'
                              ? 'Đúng một phần'
                              : 'Chưa đúng'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedEvaluation(ev)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-600" />
                            Xem AI Phản hồi
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: USER EDIT / CREATE */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUser._id ? 'Chỉnh sửa tài khoản người dùng' : 'Tạo người dùng mới'}
              </h3>
              <button type="button" onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vai trò (Role)</label>
                  <select
                    value={editingUser.role || 'user'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="user">Học viên (User)</option>
                    <option value="admin">Quản trị (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cấp độ CEFR</label>
                  <select
                    value={editingUser.level || 'B1'}
                    onChange={(e) => setEditingUser({ ...editingUser, level: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mục tiêu học tập</label>
                <select
                  value={editingUser.target || 'IELTS'}
                  onChange={(e) => setEditingUser({ ...editingUser, target: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="General English">Tiếng Anh Giao Tiếp Tổng Quát</option>
                  <option value="IELTS">Luyện thi IELTS</option>
                  <option value="TOEIC">Luyện thi TOEIC</option>
                  <option value="Academic English">Tiếng Anh Học Thuật</option>
                  <option value="Communication">Giao tiếp công sở</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUESTION EDIT / CREATE */}
      {isQuestionModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingQuestion._id ? 'Chỉnh sửa câu hỏi Writing' : 'Thêm câu hỏi mới vào ngân hàng'}
              </h3>
              <button type="button" onClick={() => setIsQuestionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Câu tiếng Việt (Đề bài)</label>
                <textarea
                  required
                  rows={2}
                  value={editingQuestion.vietnameseSentence || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, vietnameseSentence: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="Ví dụ: Tôi thường đọc sách trước khi đi ngủ mỗi tối."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đáp án mẫu chuẩn (Reference Answer)</label>
                <input
                  type="text"
                  required
                  value={editingQuestion.referenceAnswer || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, referenceAnswer: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="Ví dụ: I usually read books before going to bed every night."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cách diễn đạt khác (mỗi dòng một câu)
                </label>
                <textarea
                  rows={2}
                  value={
                    Array.isArray(editingQuestion.alternativeAnswers)
                      ? editingQuestion.alternativeAnswers.join('\n')
                      : ''
                  }
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      alternativeAnswers: e.target.value.split('\n').filter(Boolean),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="I often read a book before sleeping every evening."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trình độ CEFR</label>
                  <select
                    value={editingQuestion.level || 'B1'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, level: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề</label>
                  <select
                    value={editingQuestion.topic || 'Daily Life'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    {topics.map((t) => (
                      <option key={t._id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                    <option value="Daily Life">Daily Life</option>
                    <option value="Work & Business">Work & Business</option>
                    <option value="Education">Education</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Độ khó</label>
                  <select
                    value={editingQuestion.difficulty || 'medium'}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="easy">Dễ (Easy)</option>
                    <option value="medium">Vừa (Medium)</option>
                    <option value="hard">Khó (Hard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Từ khóa gợi ý (ngăn cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={
                    Array.isArray(editingQuestion.keywords) ? editingQuestion.keywords.join(', ') : ''
                  }
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="read, before, bed"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Lưu câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TOPIC EDIT / CREATE */}
      {isTopicModalOpen && editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingTopic._id ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề mới'}
              </h3>
              <button type="button" onClick={() => setIsTopicModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên chủ đề</label>
                <input
                  type="text"
                  required
                  value={editingTopic.name || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="Ví dụ: Environment & Green Living"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={editingTopic.description || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="Mô tả về các tình huống viết thuộc chủ đề này"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={editingTopic.order || 1}
                    onChange={(e) => setEditingTopic({ ...editingTopic, order: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Icon</label>
                  <input
                    type="text"
                    value={editingTopic.icon || 'BookOpen'}
                    onChange={(e) => setEditingTopic({ ...editingTopic, icon: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Lưu chủ đề
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: GRAMMAR EDIT / CREATE */}
      {isGrammarModalOpen && editingGrammar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingGrammar._id ? 'Chỉnh sửa điểm ngữ pháp' : 'Thêm điểm ngữ pháp mới'}
              </h3>
              <button type="button" onClick={() => setIsGrammarModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrammar} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên chủ điểm ngữ pháp</label>
                <input
                  type="text"
                  required
                  value={editingGrammar.name || ''}
                  onChange={(e) => setEditingGrammar({ ...editingGrammar, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="Ví dụ: Conditional Sentences Type 2"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả cấu trúc</label>
                <textarea
                  rows={2}
                  value={editingGrammar.description || ''}
                  onChange={(e) => setEditingGrammar({ ...editingGrammar, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="If + S + V-ed/2, S + would + V-inf"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cấp độ áp dụng</label>
                  <select
                    value={editingGrammar.level || 'All'}
                    onChange={(e) => setEditingGrammar({ ...editingGrammar, level: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="All">Tất cả (All)</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự</label>
                  <input
                    type="number"
                    value={editingGrammar.order || 1}
                    onChange={(e) => setEditingGrammar({ ...editingGrammar, order: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGrammarModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Lưu ngữ pháp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EVALUATION AUDIT DETAILS */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Chi tiết Đánh giá & Chấm điểm từ AI
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedEvaluation(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Question & Answer Box */}
              <div className="rounded-xl bg-slate-50 p-4 space-y-2 border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400">Đề bài (Tiếng Việt):</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedEvaluation.vietnameseSentence}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400">Bài làm của học viên:</span>
                  <p className="font-semibold text-indigo-900 bg-white p-2.5 rounded-lg border border-slate-200 text-xs mt-0.5">
                    {selectedEvaluation.userAnswer}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-400">Đáp án chuẩn:</span>
                  <p className="text-xs font-semibold text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 mt-0.5">
                    {selectedEvaluation.referenceAnswer}
                  </p>
                </div>
              </div>

              {/* Score & Status */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Điểm số AI</div>
                  <div className="text-2xl font-black text-indigo-600 mt-1">{selectedEvaluation.finalScore} / 100</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Cấp độ CEFR</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{selectedEvaluation.level || 'B1'}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Số lượng lỗi</div>
                  <div className="text-2xl font-black text-rose-600 mt-1">
                    {selectedEvaluation.errors?.length || 0}
                  </div>
                </div>
              </div>

              {/* Errors Breakdown */}
              {selectedEvaluation.errors && selectedEvaluation.errors.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-slate-900 mb-2">Chi tiết lỗi ngữ pháp & từ vựng phát hiện:</h4>
                  <div className="space-y-2">
                    {selectedEvaluation.errors.map((err, idx) => (
                      <div key={idx} className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-black text-rose-900 uppercase">
                            {err.type}
                          </span>
                          <span className="line-through text-rose-600 font-bold">{err.wrongText}</span>
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                          <span className="font-bold text-emerald-700">{err.correctText}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{err.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall AI Feedback */}
              {selectedEvaluation.overallFeedback && (
                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3.5 space-y-1">
                  <h4 className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    Nhận xét tổng quan từ AI:
                  </h4>
                  <p className="text-xs text-indigo-900 leading-relaxed">{selectedEvaluation.overallFeedback}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedEvaluation(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
