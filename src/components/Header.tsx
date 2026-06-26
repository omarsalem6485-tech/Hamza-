/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChefHat, ShoppingBag, Landmark, Key, ShieldAlert, Store, AlertCircle } from 'lucide-react';

interface HeaderProps {
  currentView: 'customer' | 'chef' | 'cashier' | 'manager';
  onViewChange: (view: 'customer' | 'chef' | 'cashier' | 'manager') => void;
  tableNumber: string;
}

export default function Header({ currentView, onViewChange, tableNumber }: HeaderProps) {
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [pendingView, setPendingView] = useState<'chef' | 'cashier' | 'manager' | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Track unlocked sessions in React state
  const [unlockedViews, setUnlockedViews] = useState<{ [key: string]: boolean }>({
    customer: true,
    chef: false,
    cashier: false,
    manager: false,
  });

  const handleNavClick = (view: 'customer' | 'chef' | 'cashier' | 'manager') => {
    if (view === 'customer') {
      onViewChange('customer');
      return;
    }

    // Check if already unlocked in this session
    if (unlockedViews[view]) {
      onViewChange(view);
    } else {
      setPendingView(view);
      setPasswordInput('');
      setPasswordError('');
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '1234') {
      if (pendingView) {
        setUnlockedViews(prev => ({ ...prev, [pendingView]: true }));
        onViewChange(pendingView);
        setShowPasswordModal(false);
        setPendingView(null);
      }
    } else {
      setPasswordError('رمز المرور خاطئ! الرجاء إدخال الرمز الصحيح (1234).');
    }
  };

  return (
    <>
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3 space-x-reverse cursor-pointer" onClick={() => onViewChange('customer')}>
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                ح
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
                  حَمزة السُّوري <span className="text-amber-500 text-sm hidden sm:inline">• Hamza Al-Souri</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">البيت السوري الأصيل لجميع المأكولات</p>
              </div>
            </div>

            {/* Table or Mode Badge */}
            <div className="hidden lg:flex items-center bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs">
              <span className="text-slate-400 font-medium ml-1.5">موقع الطلب:</span>
              <span className="text-amber-500 font-bold">
                {tableNumber === 'Takeaway' ? 'سفري (تيك أواي)' : `الطاولة رقم (${tableNumber})`}
              </span>
            </div>

            {/* Navigation Tabs in a glass capsule */}
            <nav className="flex items-center bg-white/5 p-1 rounded-full border border-white/10 space-x-1 sm:space-x-1.5 space-x-reverse" id="nav-tabs">
              <button
                id="btn-nav-customer"
                onClick={() => handleNavClick('customer')}
                className={`flex items-center space-x-1 sm:space-x-1.5 space-x-reverse px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentView === 'customer'
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>القائمة</span>
              </button>

              <button
                id="btn-nav-chef"
                onClick={() => handleNavClick('chef')}
                className={`flex items-center space-x-1 sm:space-x-1.5 space-x-reverse px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentView === 'chef'
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ChefHat className="h-3.5 w-3.5" />
                <span>المطبخ</span>
              </button>

              <button
                id="btn-nav-cashier"
                onClick={() => handleNavClick('cashier')}
                className={`flex items-center space-x-1 sm:space-x-1.5 space-x-reverse px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentView === 'cashier'
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Landmark className="h-3.5 w-3.5" />
                <span>الكاشير</span>
              </button>

              <button
                id="btn-nav-manager"
                onClick={() => handleNavClick('manager')}
                className={`flex items-center space-x-1 sm:space-x-1.5 space-x-reverse px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentView === 'manager'
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>الإدارة</span>
              </button>
            </nav>

            {/* System Status Display */}
            <div className="hidden sm:flex items-center gap-3 text-xs">
              <div className="flex flex-col items-end">
                <span className="text-slate-500 text-[10px]">حالة النظام</span>
                <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  ● LIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Small screen Table/Takeaway label */}
        <div className="lg:hidden bg-white/5 border-t border-white/5 text-center py-1.5 text-xs text-slate-400">
          موقع الطلب الحالي: <span className="text-amber-500 font-bold">{tableNumber === 'Takeaway' ? 'سفري (تيك أواي)' : `الطاولة رقم (${tableNumber})`}</span>
        </div>
      </header>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
          <div className="bg-[#121214] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in border border-white/10">
            <div className="p-6 border-b border-white/5 text-center">
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold font-sans text-white">قسم مغلق ومحمي بكلمة مرور</h3>
              <p className="text-xs text-slate-400 mt-1">
                عذراً، هذا القسم مخصص لموظفي المطعم فقط. يرجى إدخال رمز المرور للمتابعة.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-2 text-right">
                  رمز المرور الخاص بالقسم (الدخول بـ 1234)
                </label>
                <input
                  type="password"
                  placeholder="••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center font-bold tracking-widest text-lg text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  autoFocus
                  required
                />
                {passwordError && (
                  <div className="mt-3 flex items-start space-x-1.5 space-x-reverse bg-red-950/40 border border-red-900/30 text-red-400 p-2.5 rounded-lg text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 px-4 rounded-xl transition-all shadow-md text-sm cursor-pointer"
                >
                  تأكيد الدخول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPendingView(null);
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer border border-white/10"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
