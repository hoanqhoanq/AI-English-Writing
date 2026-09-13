import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Save, CheckCircle, Sparkles } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || 'Học viên');
  const [dailyGoal, setDailyGoal] = useState(user?.dailyGoal || 5);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        name,
        dailyGoal: Number(dailyGoal),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <User className="h-6 w-6 text-indigo-600" />
          <span>Hồ sơ cá nhân</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cài đặt tên hiển thị và số câu muốn luyện mỗi ngày.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {savedSuccess && (
          <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Cập nhật hồ sơ học tập thành công!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-2xl font-black text-white shadow-lg shadow-indigo-600/20">
              {user?.name ? user.name[0].toUpperCase() : 'H'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Học viên'}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                <Sparkles className="h-3 w-3" />
                <span>Thành viên học viên</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mục tiêu số câu viết mỗi ngày:
                </label>
                <span className="text-sm font-black text-indigo-600">{dailyGoal} câu / ngày</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
