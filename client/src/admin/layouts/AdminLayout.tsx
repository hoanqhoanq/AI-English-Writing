import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Tổng quan Hệ thống (System Overview)';
    if (path.startsWith('/admin/users')) return 'Quản lý Người Dùng & Học Viên';
    if (path.startsWith('/admin/questions')) return 'Ngân hàng Câu hỏi Writing (CEFR)';
    if (path.startsWith('/admin/ai-generate')) return 'AI Sinh câu hỏi Writing';
    if (path.startsWith('/admin/topics')) return 'Quản lý Chủ đề & Ngữ pháp trọng tâm';
    if (path.startsWith('/admin/levels')) return 'Khung Cấp độ Năng lực CEFR (A1 - C2)';
    if (path.startsWith('/admin/evaluations')) return 'Giám sát Lịch sử Chấm bài AI (AI Audit)';
    return 'Hệ thống Quản Trị Admin';
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex flex-col lg:pl-72">
        <AdminHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          title={getPageTitle()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
