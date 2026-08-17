import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { CefrLevelDef } from '../../types';
import {
  GraduationCap,
  Target,
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AdminLevelsPage: React.FC = () => {
  const [levels, setLevels] = useState<CefrLevelDef[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLevels = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getLevels();
      setLevels(data);
    } catch (err) {
      console.error('Failed to load levels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLevels();
  }, []);

  const getLevelColor = (code: string) => {
    switch (code) {
      case 'A1':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'A2':
        return 'border-teal-200 bg-teal-50 text-teal-800';
      case 'B1':
        return 'border-indigo-200 bg-indigo-50 text-indigo-800';
      case 'B2':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'C1':
        return 'border-purple-200 bg-purple-50 text-purple-800';
      case 'C2':
        return 'border-rose-200 bg-rose-50 text-rose-800';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            Khung Năng Lực Chuẩn CEFR (A1 - C2)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy chuẩn hóa lộ trình từ vựng, ngữ pháp và bài tập viết câu tiếng Anh toàn hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLevels}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Tải lại dữ liệu
        </button>
      </div>

      {/* Grid of 6 CEFR Levels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {levels.map((lvl) => {
          const color = getLevelColor(lvl.code);
          return (
            <div
              key={lvl.code}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-purple-300 hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center rounded-xl border px-3 py-1 text-sm font-black ${color}`}
                  >
                    Cấp độ {lvl.code}
                  </span>
                  <span className="text-xs font-bold text-slate-700">{lvl.name}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{lvl.description}</p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-purple-500" /> Vốn từ yêu cầu:
                  </span>
                  <span className="font-bold text-slate-800">{lvl.targetVocab} từ</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Mục tiêu ngày:
                  </span>
                  <span className="font-bold text-indigo-600">{lvl.recommendedDaily} câu/ngày</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-500" /> Câu trong kho:
                  </span>
                  <span className="font-bold text-emerald-700">{lvl.questionCount} câu</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-blue-500" /> Học viên theo học:
                  </span>
                  <span className="font-bold text-slate-800">{lvl.usersCount} học viên</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminLevelsPage;
