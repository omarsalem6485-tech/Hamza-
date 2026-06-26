/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, TrendingUp, ShoppingBag, Users, ClipboardList, 
  Package, Star, QrCode, ArrowDown, ArrowUp, AlertTriangle, 
  CheckCircle2, Plus, RefreshCw, Printer, AlertCircle, Trash2
} from 'lucide-react';
import { Order, InventoryItem, Review, OrderStatus, formatOrderId } from '../types';
import { MENU_ITEMS } from '../data/menu';

interface ManagerViewProps {
  orders: Order[];
  inventory: InventoryItem[];
  reviews: Review[];
  refreshState: () => void;
  onTableChange: (table: string) => void;
  onViewChange: (view: 'customer' | 'chef' | 'cashier' | 'manager') => void;
}

export default function ManagerView({ orders, inventory, reviews, refreshState, onTableChange, onViewChange }: ManagerViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'finance' | 'inventory' | 'reviews' | 'qr'>('finance');
  const [refillAmounts, setRefillAmounts] = useState<{ [ingId: string]: string }>({});
  const [refillSuccessMsg, setRefillSuccessMsg] = useState<string>('');
  const [qrSelectedTable, setQrSelectedTable] = useState<string>('1');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Poll state every 5 seconds for the manager dashboard
  useEffect(() => {
    refreshState();
    const interval = setInterval(() => {
      refreshState();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshState]);

  // Calculations for financials
  const paidOrders = orders.filter(o => o.isPaid && o.status !== OrderStatus.CANCELLED);
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
  const cancelledOrdersCount = orders.filter(o => o.status === OrderStatus.CANCELLED).length;
  const averageTicket = paidOrders.length > 0 ? (totalRevenue / paidOrders.length) : 0;

  // Calculate popular items
  const itemSalesMap: { [name: string]: { count: number; revenue: number } } = {};
  orders.forEach(order => {
    if (order.status !== OrderStatus.CANCELLED) {
      order.items.forEach(item => {
        if (!itemSalesMap[item.name]) {
          itemSalesMap[item.name] = { count: 0, revenue: 0 };
        }
        itemSalesMap[item.name].count += item.quantity;
        itemSalesMap[item.name].revenue += item.price * item.quantity;
      });
    }
  });

  const popularItems = Object.entries(itemSalesMap)
    .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
    .sort((a, b) => b.count - a.count);

  // Rating metrics
  const avgRating = reviews.length > 0 
    ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)) 
    : 5.0;

  const handleRefillSubmit = async (ingId: string) => {
    const amountStr = refillAmounts[ingId];
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      alert('الرجاء إدخال كمية صحيحة أكبر من الصفر.');
      return;
    }

    try {
      const response = await fetch('/api/inventory/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ingId,
          amount: Number(amountStr)
        })
      });

      if (response.ok) {
        setRefillSuccessMsg(`تم تعبئة المخزون بنجاح!`);
        setRefillAmounts(prev => ({ ...prev, [ingId]: '' }));
        refreshState();

        setTimeout(() => {
          setRefillSuccessMsg('');
        }, 3000);
      }
    } catch (err) {
      console.error('Error refilling stock:', err);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('🚨 تحذير هام! هل أنت متأكد من إعادة تهيئة قاعدة البيانات بالكامل؟ سيتم مسح المبيعات والمخازن وإرجاعها للحالة الافتراضية.')) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) {
        alert('تمت إعادة ضبط النظام للقيم الافتراضية بنجاح.');
        refreshState();
      }
    } catch (err) {
      console.error('Error resetting system:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Generate dynamic QR code URL
  // Point it to origin + query parameter table
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://hamza-alsouri.com';
  const qrTargetUrl = `${appOrigin}/?table=${qrSelectedTable}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrTargetUrl)}`;

  const handleTestQrScan = () => {
    onTableChange(qrSelectedTable);
    onViewChange('customer');
    alert(`تمت محاكاة مسح الكود! تم تحويلك لقسم العميل كطاولة رقم ${qrSelectedTable}.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in print:bg-white print:p-0">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 mb-6 gap-4 print:hidden">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-amber-500/10 text-amber-500 p-3 rounded-2xl border border-amber-500/20">
            <ShieldAlert className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-white">لوحة تحكم وإدارة حمزة السوري</h2>
            <p className="text-xs text-slate-400 mt-1">متابعة الأرباح الإجمالية، تتبع المخزون الغذائي، طباعة أكواد الطاولات، وقراءة تقييمات العملاء</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse self-start sm:self-auto">
          <button 
            onClick={refreshState}
            className="flex items-center space-x-1.5 space-x-reverse bg-white/5 hover:bg-white/10 text-amber-500 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>تحديث البيانات</span>
          </button>
          
          <button 
            onClick={handleResetDatabase}
            disabled={isResetting}
            className="flex items-center space-x-1.5 space-x-reverse bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 px-4 py-2 rounded-xl text-xs font-bold border border-rose-900/30 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>إعادة تهيئة النظام</span>
          </button>
        </div>
      </div>

      {/* Main Tabs (Hidden on print) */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4 mb-6 print:hidden">
        <button
          onClick={() => setActiveSubTab('finance')}
          className={`flex items-center space-x-1.5 space-x-reverse px-4.5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'finance'
              ? 'bg-amber-500 text-black shadow-lg font-bold'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>💰 الإيرادات والتقرير اليومي</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`flex items-center space-x-1.5 space-x-reverse px-4.5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'inventory'
              ? 'bg-amber-500 text-black shadow-lg font-bold'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>📦 إدارة مخزون المكونات</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`flex items-center space-x-1.5 space-x-reverse px-4.5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'reviews'
              ? 'bg-amber-500 text-black shadow-lg font-bold'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Star className="h-4 w-4" />
          <span>⭐ تقييمات وآراء الزبائن</span>
        </button>

        <button
          onClick={() => setActiveSubTab('qr')}
          className={`flex items-center space-x-1.5 space-x-reverse px-4.5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'qr'
              ? 'bg-amber-500 text-black shadow-lg font-bold'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>🖨️ طباعة باركود QR للطلبات</span>
        </button>
      </div>

      {/* SUB-PANEL 1: Finance Reports & Revenues */}
      {activeSubTab === 'finance' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            
            {/* Revenue */}
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 block">إجمالي الإيرادات اليومية</span>
              <div className="flex items-baseline space-x-1 space-x-reverse mt-2">
                <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-sans">{totalRevenue.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-slate-400">ج.م</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-0.5 space-x-reverse mt-2">
                <ArrowUp className="h-3.5 w-3.5" />
                <span>+ 12.5% منذ الأمس</span>
              </span>
            </div>

            {/* Total orders count */}
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 block">إجمالي الفواتير والطلبات</span>
              <div className="flex items-baseline space-x-1 space-x-reverse mt-2">
                <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-sans">{totalOrdersCount}</span>
                <span className="text-[10px] font-bold text-slate-400">طلب</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-2">
                سُلم منها {completedOrdersCount} | لُغي {cancelledOrdersCount}
              </span>
            </div>

            {/* Average ticket */}
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 block">متوسط قيمة الطلب الفردي</span>
              <div className="flex items-baseline space-x-1 space-x-reverse mt-2">
                <span className="text-xl sm:text-2xl font-extrabold text-white font-sans">{averageTicket.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-slate-400">ج.م</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-2">
                متوسط الإنفاق لكل زبون اليوم
              </span>
            </div>

            {/* Customer Rating avg */}
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 block">معدل رضا العملاء</span>
              <div className="flex items-center space-x-1.5 space-x-reverse mt-2">
                <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-sans">{avgRating}</span>
                <div className="flex text-amber-400">
                  <Star className="h-4.5 w-4.5" fill="currentColor" />
                </div>
              </div>
              <span className="text-[10px] text-amber-400 font-bold block mt-2">
                إجمالي التقييمات: {reviews.length} تقييم
              </span>
            </div>

          </div>

          {/* Grid: Popular items and transaction logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sales ranking of food */}
            <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 mb-4 font-sans">
                🔥 تصنيف الأكلات الأكثر طلباً ومبيعاً
              </h3>

              {popularItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  لم يتم بيع أي أطعمة حتى الآن اليوم
                </div>
              ) : (
                <div className="space-y-4">
                  {popularItems.map((item, idx) => {
                    const topCount = popularItems[0].count;
                    const percent = topCount > 0 ? (item.count / topCount) * 100 : 0;

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-white">
                          <span className="flex items-center space-x-1.5 space-x-reverse">
                            <span className="bg-white/10 text-slate-300 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-sans">
                              {idx + 1}
                            </span>
                            <span>{item.name}</span>
                          </span>
                          <span className="font-sans text-slate-400">{item.count} طلب (بقيمة {item.revenue.toFixed(2)} ج.م)</span>
                        </div>
                        {/* Progress visualizer */}
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily report log */}
            <div className="lg:col-span-7 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 mb-4 font-sans">
                📊 تقرير المبيعات اليومية المفصل للورديات
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-400">
                      <th className="p-3 font-semibold">رقم الوردية والطلب</th>
                      <th className="p-3 font-semibold">موقع الطاولة</th>
                      <th className="p-3 font-semibold">أصناف الطعام</th>
                      <th className="p-3 font-semibold">قيمة الفاتورة</th>
                      <th className="p-3 font-semibold">تسوية النقدية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5">
                        <td className="p-3 font-bold text-white">#{formatOrderId(order.id)}</td>
                        <td className="p-3 font-semibold text-slate-300">
                          {order.tableNumber === 'Takeaway' ? 'سفري 🚗' : `طاولة ${order.tableNumber}`}
                        </td>
                        <td className="p-3 truncate max-w-[160px] font-medium text-slate-400" title={order.items.map(i => i.name).join('، ')}>
                          {order.items.map(i => `${i.name} (x${i.quantity})`).join('، ')}
                        </td>
                        <td className="p-3 font-extrabold text-amber-500">{order.total.toFixed(2)} ج.م</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            order.isPaid 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                              : 'bg-rose-950/40 text-rose-400 border-rose-900/30'
                          }`}>
                            {order.isPaid ? 'مقبولة ومستلمة' : 'بانتظار التحصيل'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-PANEL 2: Inventory & Materials Control */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 mb-5 gap-3">
              <div>
                <h3 className="text-sm font-bold text-white font-sans">مخزن مكونات مأكولات حمزة السوري</h3>
                <p className="text-xs text-slate-400 mt-1">تتبع مستويات المواد الخام، وتخصيص مستويات الإنذار التلقائية وإعادة التعبئة</p>
              </div>

              {refillSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 space-x-reverse font-bold shadow-lg">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>{refillSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Inventory Listing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item) => {
                const isLow = item.quantity <= item.minStock;
                const percentLeft = Math.min(100, Math.max(0, (item.quantity / (item.minStock * 4)) * 100));

                return (
                  <div 
                    key={item.id} 
                    id={`inventory-card-${item.id}`}
                    className={`rounded-2xl border p-5 space-y-4 shadow-lg transition-all ${
                      isLow 
                        ? 'border-amber-500/30 bg-[#121214]/60' 
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">مكون خام لوجبات الشاورما والمشويات</span>
                      </div>
                      
                      {isLow ? (
                        <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 space-x-reverse animate-pulse border border-amber-500/20">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>نقص في المخزون!</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
                          آمن ومكتمل
                        </span>
                      )}
                    </div>

                    {/* Stock level details */}
                    <div className="flex justify-between items-baseline py-1">
                      <span className="text-slate-300 text-xs font-semibold">الكمية المتوفرة حالياً:</span>
                      <div className="flex items-baseline space-x-1 space-x-reverse">
                        <span className={`text-xl font-extrabold font-sans ${isLow ? 'text-amber-400' : 'text-white'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{item.unit}</span>
                      </div>
                    </div>

                    {/* Simple stock visual progress */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${percentLeft}%` }}
                      />
                    </div>

                    {/* Refill Quick input and button */}
                    <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="الكمية المضافة"
                        value={refillAmounts[item.id] || ''}
                        onChange={(e) => setRefillAmounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-full bg-white/5 px-3 py-2 border border-white/10 rounded-xl text-xs text-center text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 transition-all font-sans font-bold"
                      />
                      <button
                        onClick={() => handleRefillSubmit(item.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-black p-2 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                        title="إضافة وتعبئة المخزن"
                      >
                        <Plus className="h-4.5 w-4.5 text-black" />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-500 font-semibold flex justify-between">
                      <span>حد الإنذار الأدنى: {item.minStock} {item.unit}</span>
                      <span>سعة المخزن التقديرية: {item.minStock * 4} {item.unit}</span>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Inventory-recipe descriptions */}
            <div className="mt-8 p-5 bg-white/5 border border-white/10 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">💡 معلومات ترابط المخزون التلقائي بالوجبات:</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                كل وجبة يتم طلبها من العميل وتأكيدها، يقوم النظام بخصم المكونات الخاصة بها من مخزن المواد الخام فوراً وتلقائياً. شاورما دبل تخصم (150 جرام صدور دجاج، رغيف خبز سوري، و20 مل ثومية). وجبة عربي فرط تخصم (220 جرام دجاج، رغيفين صاج، و40 مل ثومية). طبق كباب حلبي يخصم (250 جرام لحم مفروم بلدي). وهذا يضمن أن العميل لا يطلب صنفاً نفذت مكوناته الأساسية من المطبخ.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* SUB-PANEL 3: Customer Ratings Reviews list */}
      {activeSubTab === 'reviews' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 mb-4 font-sans">
              ⭐ مراجعات وتقييمات زبائن حمزة السوري المباشرة
            </h3>

            {reviews.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                لا توجد تقييمات مكتوبة من الزبائن بعد اليوم.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 shadow-lg">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-amber-400 text-xs bg-white/5 px-2.5 py-1 rounded-md border border-white/10 shadow-md">
                          {rev.tableNumber === 'Takeaway' ? 'سفري 🚗' : `طاولة ${rev.tableNumber}`}
                        </span>
                        <p className="text-[9px] text-slate-500 mt-1.5 font-medium">
                          {new Date(rev.createdAt).toLocaleDateString('ar-EG')} {new Date(rev.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Rating stars display */}
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className="h-4 w-4" 
                            fill={i < rev.rating ? 'currentColor' : 'none'} 
                            strokeWidth={1.5}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment text */}
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold font-sans italic bg-white/5 p-3 rounded-xl border border-white/5">
                      &ldquo; {rev.comment || 'بدون تعليق مكتوب'} &rdquo;
                    </p>

                    <div className="text-[10px] text-slate-500 font-semibold flex justify-between">
                      <span>كود الطلب المقترن: #{formatOrderId(rev.orderId)}</span>
                      <span className="text-emerald-400">تم التحقق من الطلب ✔️</span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-PANEL 4: Table QR printer and generator */}
      {activeSubTab === 'qr' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 print:p-0">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 mb-6 gap-3 print:hidden">
              <div>
                <h3 className="text-sm font-bold text-white font-sans">طباعة بطاقات الباركود QR للطاولات</h3>
                <p className="text-xs text-slate-400 mt-1">توليد وطباعة بطاقات QR مخصصة توضع على كل طاولة لتمكين الزبائن من مسح الكود والطلب فوراً من الموبايل</p>
              </div>

              <button
                onClick={() => window.print()}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 space-x-reverse shadow-md transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة بطاقة الباركود</span>
              </button>
            </div>

            {/* Layout QR Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Table Selector form (Hidden on print) */}
              <div className="lg:col-span-5 space-y-4 print:hidden">
                <div>
                  <label className="block text-slate-300 text-xs font-bold mb-2">
                    اختر رقم الطاولة لتخصيص الباركود:
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['1', '2', '3', '4', '5'].map((tableNum) => (
                      <button
                        key={tableNum}
                        onClick={() => setQrSelectedTable(tableNum)}
                        className={`py-3.5 rounded-xl text-xs font-extrabold font-sans transition-all cursor-pointer ${
                          qrSelectedTable === tableNum
                            ? 'bg-amber-500 text-black shadow-lg scale-105 font-extrabold'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        طاولة {tableNum}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-white">🔗 رابط التوجيه المدمج بالباركود:</h4>
                  <code className="block text-[10px] text-amber-400 bg-black/60 p-2.5 rounded-lg font-mono border border-white/5 select-all break-all leading-normal">
                    {qrTargetUrl}
                  </code>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    عندما يقوم العميل بمسح هذا الكود بجواله، سيقوم المتصفح بفتح المنيو السوري مخصصاً ومقفلاً لطاولة رقم {qrSelectedTable} تلقائياً وبدون أي عناء!
                  </p>
                </div>

                {/* Simulated Quick Link scan trigger */}
                <button
                  onClick={handleTestQrScan}
                  className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-extrabold py-3 px-4 rounded-xl text-xs border border-amber-500/20 transition-all cursor-pointer"
                >
                  📲 محاكاة عمل المسح (قراءة QR كطاولة {qrSelectedTable})
                </button>
              </div>

              {/* Printable Framed Card Design */}
              <div className="lg:col-span-7 flex justify-center">
                <div className="bg-white border-4 border-amber-950 p-8 rounded-3xl w-full max-w-[340px] text-center shadow-2xl space-y-6 animate-fade-in relative text-black">
                  
                  {/* Damascus pattern border accent */}
                  <div className="absolute inset-2 border border-dashed border-amber-950/30 rounded-2xl pointer-events-none" />

                  {/* Header */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-900 block uppercase">أهلاً وسهلاً بكم في</span>
                    <h3 className="text-xl font-extrabold text-amber-950 font-sans">مطعم حمزة السوري</h3>
                    <p className="text-[9px] text-amber-700 font-bold">البيت السوري الأصيل للمأكولات</p>
                  </div>

                  {/* Dynamic QR Code Image */}
                  <div className="bg-amber-50 p-4.5 rounded-2xl border border-amber-100/60 inline-block">
                    <img 
                      src={qrImageUrl} 
                      alt={`QR Code Table ${qrSelectedTable}`}
                      referrerPolicy="no-referrer"
                      className="w-44 h-44 mx-auto object-contain bg-white rounded-lg p-1.5 shadow-sm"
                    />
                  </div>

                  {/* Highlighted Table Banner */}
                  <div className="bg-amber-950 text-white py-2 px-4 rounded-xl inline-block text-xs font-bold font-sans">
                    طاولة رقم: {qrSelectedTable} 🪑
                  </div>

                  {/* Action Instruction */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-900 font-sans">امسح الكود بكاميرا جوالك واطلب مباشرة</p>
                    <p className="text-[9px] text-slate-500 font-medium">سيقوم المطبخ باستلام طلبك وتحضيره فورياً بأقصى سرعة بالهناء والشفاء</p>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
