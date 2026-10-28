import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  UserCheck, 
  ArrowLeftRight, 
  History, 
  Cloud, 
  Plus, 
  Menu, 
  X,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickAction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAction
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'purchases', label: 'Factory Buy', icon: Truck },
    { id: 'wholesale', label: 'Wholesale', icon: Users },
    { id: 'retail', label: 'Retail Khata', icon: UserCheck },
    { id: 'payments', label: 'Balance', icon: ArrowLeftRight },
    { id: 'history', label: 'Records & Search', icon: History },
    { id: 'cloud', label: 'Cloud & Account', icon: Cloud }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
      {/* Top Header: Brand Wordmark and Action Center */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <button 
          onClick={() => {
            setActiveTab('dashboard');
            setMobileMenuOpen(false);
          }} 
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none shrink-0"
        >
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              KB <span className="text-amber-600 dark:text-amber-500">Factory</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 tracking-normal font-medium hidden sm:inline">
              Animal Feed Wholesale &amp; Retail Khata
            </span>
          </div>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* User Profile Pill (Desktop) */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="font-semibold max-w-[120px] truncate">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
          )}

          {/* Theme Toggle Button (Desktop & Mobile) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle light and dark theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 stroke-[2.2]" />
            )}
          </button>

          {/* Sign Out Button (Desktop) */}
          {user && (
            <button
              onClick={() => logout()}
              className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 stroke-[2]" />
            </button>
          )}

          {/* New Entry Primary Action */}
          <button
            onClick={onOpenQuickAction}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">New Entry</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Centered Navigation Row - Hidden on mobile, shown on md screens and above */}
      <div className="hidden md:block w-full bg-slate-50/90 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-center">
          <nav className="flex items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto py-1.5 scrollbar-none max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white stroke-[2.5]' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Menu Dropdown (when hamburger is toggled) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 space-y-1 shadow-lg transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              System Modules
            </span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            );
          })}

          {user && (
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out ({user.displayName || user.email?.split('@')[0]})</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Smartphone Bottom Quick Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex justify-around items-center no-print shadow-lg transition-colors">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium ${
            activeTab === 'dashboard' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium ${
            activeTab === 'purchases' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Truck className="w-4 h-4 mb-0.5" />
          <span>Factory</span>
        </button>
        <button
          onClick={() => setActiveTab('wholesale')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium ${
            activeTab === 'wholesale' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Parties</span>
        </button>
        <button
          onClick={() => setActiveTab('retail')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium ${
            activeTab === 'retail' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <UserCheck className="w-4 h-4 mb-0.5" />
          <span>Khata</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium ${
            activeTab === 'payments' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 mb-0.5" />
          <span>Balance</span>
        </button>
      </div>
    </header>
  );
};
