import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

export const Header = ({ onMobileMenuToggle }) => {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden text-stone-600 hover:text-stone-900 p-2 rounded-md hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex min-w-0 flex-col">
          <h1 className="truncate font-serif text-sm font-semibold tracking-tight text-stone-900 sm:text-base">
            Campus Management Portal
          </h1>
          <span className="hidden text-[11px] text-stone-500 sm:inline">
            Campus member services · {currentDate}
          </span>
        </div>
      </div>

      {/* Right: Greeting & Role Badge */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="text-xs font-semibold text-stone-800">
            Welcome, {user?.memberProfile?.fullName?.split(' ')[0] || 'Member'}
          </span>
          <Badge variant={user?.role === 'admin' ? 'admin' : 'neutral'} size="xs">
            {user?.role === 'admin' ? 'Administrator' : 'Member'}
          </Badge>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
          {user?.memberProfile?.fullName ? user.memberProfile.fullName.charAt(0).toUpperCase() : 'S'}
        </div>
      </div>
    </header>
  );
};

export default Header;
