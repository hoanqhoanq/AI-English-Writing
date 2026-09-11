import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  PenTool,
  Sparkles,
  BarChart3,
  Flame,
  ArrowRight,
  Compass,
  FileText,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/30">
              Trình độ hiện tại: {user?.level || 'B1'}
            </span>
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 fill-current" /> {user?.streak || 4} ngày streak
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">
            Xin chào, {user?.name || 'Học viên'}! 👋
          </h1>
          <p className="text-sm text-indigo-200 max-w-md">
            Mục tiêu của bạn: <strong className="text-white">{user?.target || 'IELTS'}</strong> · Chỉ tiêu hôm nay: <strong className="text-white">{user?.dailyGoal || 5} câu</strong>
          </p>
        </div>

        <Link
          to="/practice"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-900 shadow-lg hover:bg-indigo-50 transition-all self-start sm:self-auto"
        >
          <PenTool className="h-4 w-4" />
          <span>Tiếp tục luyện viết</span>
        </Link>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/learning"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-300 hover:shadow-md transition-all space-y-4 group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
              Writing Learning
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Học Grammar và Writing Skills theo từng chủ đề — chọn bất kỳ chủ đề nào bạn muốn.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-teal-600">
            <span>Khám phá ngay</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/paragraph-writing"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-fuchsia-300 hover:shadow-md transition-all space-y-4 group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-50 text-fuchsia-600 group-hover:scale-110 transition-transform">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-fuchsia-600 transition-colors">
              Viết đoạn văn
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Luyện viết đoạn văn theo chủ đề, AI chấm điểm và gợi ý sửa bài.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-fuchsia-600">
            <span>Bắt đầu viết</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/practice"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all space-y-4 group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
            <PenTool className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Luyện viết câu trực tuyến
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Dịch câu theo chủ đề, nhận đánh giá ngữ pháp và sửa lỗi tức thì.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-indigo-600">
            <span>Bắt đầu ngay</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/generator"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-purple-300 hover:shadow-md transition-all space-y-4 group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              AI Sinh đề theo yêu cầu
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tạo câu hỏi luyện viết theo ngữ cảnh tự do với công nghệ Gemini.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-purple-600">
            <span>Khám phá Gemini AI</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/analytics"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all space-y-4 group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Thống kê & Chẩn đoán lỗi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Xem biểu đồ điểm số, phân bố loại lỗi và giải pháp từ AI.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <span>Xem phân tích</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
