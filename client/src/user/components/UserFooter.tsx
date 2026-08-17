import React from 'react';
import { PenTool, CheckCircle, Brain, Target } from 'lucide-react';

export const UserFooter: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white py-12 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <PenTool className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900">AI English Writing Practice</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 max-w-md">
              Hệ thống luyện viết câu tiếng Anh chuẩn CEFR với trí tuệ nhân tạo. Tự động chấm điểm, phát hiện lỗi ngữ pháp, phân tích điểm yếu và tối ưu phản xạ câu văn.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Tính năng học viên</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-1.5 text-slate-500">
                <CheckCircle className="h-3.5 w-3.5 text-indigo-500" />
                Luyện viết câu theo ngữ cảnh
              </li>
              <li className="flex items-center gap-1.5 text-slate-500">
                <Brain className="h-3.5 w-3.5 text-indigo-500" />
                Chấm chữa & Giải thích chi tiết
              </li>
              <li className="flex items-center gap-1.5 text-slate-500">
                <Target className="h-3.5 w-3.5 text-indigo-500" />
                Chuẩn hóa ngữ pháp A1 - C2
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Chuẩn mực đánh giá</h4>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Được tích hợp cùng Gemini AI và Heuristic Engine để đảm bảo phản hồi tức thì, chính xác cả về tính tự nhiên (naturalness) và độ chuẩn xác ngữ pháp (grammatical accuracy).
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} AI English Writing Practice. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default UserFooter;
