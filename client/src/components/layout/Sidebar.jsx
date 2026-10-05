import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  History,
  User,
  Settings,
  X,
  LogOut,
} from 'lucide-react';
import CampusBrand from '../common/CampusBrand';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', path: '/members', icon: Users },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Attendance', path: '/attendance', icon: CheckSquare },
  { name: 'Event History', path: '/event-history', icon: History },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const activeClass = 'bg-slate-700 text-white shadow-sm';
  const inactiveClass = 'text-stone-700 hover:bg-slate-100 hover:text-slate-700';

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-stone-200 w-64 select-none">
      {/* Brand Header */}
      <div className="border-b border-stone-200 bg-[#f8fafc] px-5 py-5">
        <div className="flex items-center justify-between gap-2">
          <CampusBrand className="h-12 w-12" textClassName="text-base font-bold text-stone-900" />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-stone-400 hover:text-stone-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        </div>
        <div className="mt-4 flex items-center gap-2.5 border-t border-stone-200/80 pt-3">
          <span className="text-[10px] font-medium leading-snug text-stone-500">Campus member services</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? activeClass : inactiveClass
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer User Info & Logout */}
      <div className="p-4 border-t border-stone-200 bg-stone-50">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.memberProfile?.profilePhotoUrl || 'https://avatar.iran.liara.run/public'}
              onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/avatar-default.svg'; }}
              alt={user?.memberProfile?.fullName || 'User'}
              className="w-8 h-8 rounded-full border border-stone-300 object-cover shrink-0"
            />
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-stone-900 truncate">
                {user?.memberProfile?.fullName || user?.name || user?.username}
              </span>
              <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                {user?.role || 'Member'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 mt-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden md:flex h-screen sticky top-0 shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs"
            onClick={onClose}
          />
          <div className="relative z-10 flex h-full">{navContent}</div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
