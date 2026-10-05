import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { sessionError, checkAuth } = useAuth();

  return (
      <div className="relative isolate min-h-screen bg-slate-50">
        <div className="relative z-10 flex min-h-screen flex-col antialiased md:flex-row">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto bg-white/35 backdrop-blur-[2px]">
            {sessionError && (
              <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800">
                <span>{sessionError}</span>
                <Button variant="secondary" size="sm" onClick={checkAuth}>Retry session check</Button>
              </div>
            )}
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="border-t border-stone-200 bg-white px-6 py-4 text-center text-xs text-stone-500">
            <span>Campus Management Portal</span>
          </footer>
        </div>
        </div>
      </div>
  );
};

export default AppLayout;
