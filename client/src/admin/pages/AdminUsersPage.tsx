import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { AdminUser } from '../../types';
import {
  Users,
  Search,
  UserPlus,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'admin'>('all');

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
    } catch (err) {
      showToast('Không thể tải danh sách người dùng', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (userId: string, email: string) => {
    try {
      const updated = await adminService.toggleUserStatus(userId);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isActive: updated.isActive } : u)));
      showToast(`Đã ${updated.isActive ? 'mở khóa' : 'khóa'} tài khoản ${email}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Thao tác thất bại', 'error');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      if (editingUser._id) {
        const updated = await adminService.updateUser(editingUser._id, editingUser);
        setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
        showToast('Cập nhật người dùng thành công');
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
        showToast('Tạo người dùng mới thành công');
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể lưu người dùng', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${name}" khỏi hệ thống?`)) return;
    try {
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      showToast(`Đã xóa tài khoản ${name}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa người dùng', 'error');
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={userStatusFilter}
            onChange={(e) => setUserStatusFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:bg-white focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã bị khóa</option>
          </select>

          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:bg-white focus:outline-none"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="user">Học viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingUser({ name: '', email: '', role: 'user', level: 'B1', target: 'IELTS' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs transition"
          >
            <UserPlus className="h-4 w-4" />
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Học viên</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trình độ CEFR</th>
                <th className="px-4 py-3">Mục tiêu</th>
                <th className="px-4 py-3">Lượt làm</th>
                <th className="px-4 py-3">Điểm TB</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Không tìm thấy người dùng phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.isActive !== false;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
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
                              <Check className="h-3 w-3" /> Đang hoạt động
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
                            onClick={() => handleToggleStatus(u._id, u.email)}
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
                              setIsModalOpen(true);
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

      {/* User Create / Edit Modal */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingUser._id ? 'Chỉnh sửa tài khoản người dùng' : 'Tạo người dùng mới'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
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
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="user@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={editingUser.role || 'user'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="A1">A1 - Sơ cấp</option>
                    <option value="A2">A2 - Tiền trung cấp</option>
                    <option value="B1">B1 - Trung cấp</option>
                    <option value="B2">B2 - Trên trung cấp</option>
                    <option value="C1">C1 - Cao cấp</option>
                    <option value="C2">C2 - Thành thạo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mục tiêu học tập</label>
                <select
                  value={editingUser.target || 'IELTS'}
                  onChange={(e) => setEditingUser({ ...editingUser, target: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
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
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
