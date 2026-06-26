/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Utensils, AlertTriangle, Store, HelpCircle } from 'lucide-react';
import { Order, InventoryItem, Review } from './types';
import Header from './components/Header';
import CustomerView from './components/CustomerView';
import ChefView from './components/ChefView';
import CashierView from './components/CashierView';
import ManagerView from './components/ManagerView';

export default function App() {
  const [view, setView] = useState<'customer' | 'chef' | 'cashier' | 'manager'>('customer');
  const [tableNumber, setTableNumber] = useState<string>('3'); // Default Table 3
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. Fetch State from Server
  const fetchState = useCallback(async () => {
    try {
      const response = await fetch('/api/state');
      if (!response.ok) {
        throw new Error('فشل جلب البيانات من الخادم المالي للمطعم.');
      }
      const data = await response.json();
      setOrders(data.orders || []);
      setInventory(data.inventory || []);
      setReviews(data.reviews || []);
      setErrorMsg('');
    } catch (err: any) {
      console.error('Error syncing state:', err);
      setErrorMsg('نعتذر، لم نتمكن من الاتصال بخوادم مطعم حمزة السوري الآن. يرجى التحقق من اتصال الإنترنت.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Initial Setup and Query Params Parsing
  useEffect(() => {
    // Parse table parameters (e.g. ?table=2) to lock order table location
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      setTableNumber(tableParam);
      setView('customer'); // Scan redirects customer directly to menu
    }
    
    fetchState();
  }, [fetchState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-amber-900/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-red-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="bg-[#121214] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-6 relative z-10">
          <div className="bg-amber-500/10 text-amber-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)] border border-amber-500/20">
            <Store className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white font-sans">مطعم حمزة السوري</h3>
            <p className="text-xs text-slate-400 font-medium">جاري تشغيل شاشات الخدمة الذكية والربط الفوري...</p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-amber-900/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-red-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="bg-[#121214] border border-red-950/40 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-5 relative z-10">
          <div className="bg-red-500/10 text-red-500 w-14 h-14 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-md font-bold text-white font-sans">فشل الاتصال بالنظام</h3>
            <p className="text-xs text-red-400 font-semibold leading-relaxed">
              {errorMsg}
            </p>
          </div>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchState();
            }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            إعادة محاولة الاتصال بنقرة واحدة 🔄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 pb-16 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[10%] left-[-100px] w-[400px] h-[400px] bg-amber-900/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-100px] w-[500px] h-[500px] bg-red-900/5 blur-[150px] rounded-full pointer-events-none"></div>
      
      {/* Dynamic Header */}
      <Header 
        currentView={view} 
        onViewChange={setView} 
        tableNumber={tableNumber} 
      />

      {/* Main Switchboard Routing */}
      <main className="relative z-10">
        {view === 'customer' && (
          <CustomerView
            orders={orders}
            inventory={inventory}
            tableNumber={tableNumber}
            onTableChange={setTableNumber}
            refreshState={fetchState}
          />
        )}

        {view === 'chef' && (
          <ChefView 
            orders={orders} 
            refreshState={fetchState} 
          />
        )}

        {view === 'cashier' && (
          <CashierView 
            orders={orders} 
            refreshState={fetchState} 
          />
        )}

        {view === 'manager' && (
          <ManagerView
            orders={orders}
            inventory={inventory}
            reviews={reviews}
            refreshState={fetchState}
            onTableChange={setTableNumber}
            onViewChange={setView}
          />
        )}
      </main>

      {/* Floating Customer Help Note */}
      {view === 'customer' && (
        <div className="fixed bottom-4 left-4 z-40 bg-black/80 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl shadow-lg max-w-[280px] hidden sm:block animate-fade-in">
          <div className="flex items-start space-x-2 space-x-reverse">
            <div className="bg-amber-500/10 text-amber-400 p-1.5 rounded-lg border border-amber-500/20">
              <HelpCircle className="h-4.5 w-4.5" />
            </div>
            <div>
              <h5 className="text-[11px] font-bold text-white">💡 تلميح للمحاكاة وتجربة النظام:</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                جرب فتح صفحتين بجانب بعضهما، أو مسح الـ QR code الذي ينتجه المدير من جوالك، واطلب شاورما أو كباب. ستجد الطلب ينتقل للشيف والكاشير على الفور وبشكل تفاعلي رائع!
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
