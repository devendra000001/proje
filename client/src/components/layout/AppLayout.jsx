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
      <div className="relative isolate min-h-screen bg-[#FAF9F6]">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute -inset-2 bg-cover bg-center bg-no-repeat opacity-[0.45] blur-[2px]"
            style={{ backgroundImage: "url('/assets/path.webp')" }}
          />
          <div className="absolute inset-0 bg-[#FAF9F6]/60" />
        </div>

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
              <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <span>{sessionError}</span>
                <Button variant="secondary" size="sm" onClick={checkAuth}>Retry session check</Button>
              </div>
            )}
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="border-t border-stone-200 bg-white px-6 py-4 text-center text-xs text-stone-500">
            <span>RSS VNIT Shakha Portal • Internal Member Portal</span>
          </footer>
        </div>
        </div>
      </div>
  );
};

export default AppLayout;
