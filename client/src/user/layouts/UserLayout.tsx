import React from 'react';
import { Outlet } from 'react-router-dom';
import UserNavbar from '../components/UserNavbar';
import UserFooter from '../components/UserFooter';

export const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <div>
        <UserNavbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <UserFooter />
    </div>
  );
};

export default UserLayout;
