/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Flame, Check, AlertTriangle, Play, XCircle, Clock, 
  Sparkles, RotateCcw, HelpCircle, RefreshCw, Layers
} from 'lucide-react';
import { Order, OrderStatus, formatOrderId } from '../types';

interface ChefViewProps {
  orders: Order[];
  refreshState: () => void;
}

export default function ChefView({ orders, refreshState }: ChefViewProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'completed'>('pending');
  const [prepTimes, setPrepTimes] = useState<{ [orderId: string]: number }>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Poll state every 3 seconds for the kitchen to keep it completely real-time!
  useEffect(() => {
    refreshState();
    const interval = setInterval(() => {
      refreshState();
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshState]);

  // Filters orders based on status
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);
  const preparingOrders = orders.filter(o => o.status === OrderStatus.PREPARING);
  const completedOrders = orders.filter(o => o.status === OrderStatus.READY || o.status === OrderStatus.DELIVERED);

  const handleSetPrepTime = (orderId: string, mins: number) => {
    setPrepTimes(prev => ({ ...prev, [orderId]: mins }));
  };

  const handleAcceptOrder = async (orderId: string) => {
    const mins = prepTimes[orderId] || 15; // default 15 mins
    setUpdatingId(orderId);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: OrderStatus.PREPARING,
          estimatedTimeMinutes: mins
        })
      });

      if (response.ok) {
        refreshState();
      }
    } catch (err) {
      console.error('Error accepting order:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setUpdatingId(orderId);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: OrderStatus.READY
        })
      });

      if (response.ok) {
        refreshState();
      }
    } catch (err) {
      console.error('Error marking ready:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الطلب؟ سيتم استعادة المكونات تلقائياً إلى المخزن.')) {
      return;
    }
    setUpdatingId(orderId);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: OrderStatus.CANCELLED
        })
      });

      if (response.ok) {
        refreshState();
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 mb-6 gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-amber-500/10 text-amber-500 p-3 rounded-2xl border border-amber-500/20">
            <ChefHat className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-white">شاشة مطبخ حمزة السوري</h2>
            <p className="text-xs text-slate-400 mt-1">تجهيز طلبات الصالة والسفري وتنسيقها مع الكاشير</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse self-start sm:self-auto">
          <button 
            onClick={refreshState}
            className="flex items-center space-x-1.5 space-x-reverse bg-white/5 hover:bg-white/10 text-amber-500 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>تحديث الطلبات</span>
          </button>
        </div>
      </div>

      {/* Statistics Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">الطلبات الواردة (الجديدة)</span>
            <p className="text-2xl font-extrabold text-amber-500 mt-1 font-sans">{pendingOrders.length} طلبات</p>
          </div>
          <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 border border-amber-500/20">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">قيد التحضير حالياً</span>
            <p className="text-2xl font-extrabold text-amber-500 mt-1 font-sans">{preparingOrders.length} أطباق</p>
          </div>
          <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500 border border-amber-500/20 animate-pulse">
            <Flame className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">تم تجهيزها اليوم</span>
            <p className="text-2xl font-extrabold text-emerald-500 mt-1 font-sans">{completedOrders.length} طلبات</p>
          </div>
          <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-500 border border-emerald-500/20">
            <Check className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/10 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          id="tab-chef-pending"
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'border-amber-500 text-amber-500 font-sans'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          🚨 طلبات جديدة بانتظار الاعتماد ({pendingOrders.length})
        </button>
        <button
          id="tab-chef-preparing"
          onClick={() => setActiveTab('preparing')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'preparing'
              ? 'border-amber-500 text-amber-500 font-sans'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          🔥 قيد التحضير على الصاج ({preparingOrders.length})
        </button>
        <button
          id="tab-chef-completed"
          onClick={() => setActiveTab('completed')}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'border-amber-500 text-amber-500 font-sans'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          📦 تم تجهيزها وتسليمها ({completedOrders.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {pendingOrders.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md p-12 rounded-3xl border border-white/10 text-center text-slate-400 shadow-2xl">
              <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-30 text-amber-500" />
              <p className="text-sm font-bold text-white font-sans">لا توجد طلبات جديدة حالياً</p>
              <p className="text-xs text-slate-400 mt-1">بمجرد قيام أي عميل بطلب طعام من هاتفه ستظهر هنا فوراً تلقائياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingOrders.map((order) => {
                const currentPrepTime = prepTimes[order.id] || 15;
                return (
                  <div key={order.id} className="bg-[#121214]/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all animate-fade-in">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-white/5 pb-3">
                      <div>
                        <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-md text-xs font-bold border border-amber-500/20">
                          طلب رقم: #{formatOrderId(order.id)}
                        </span>
                        <h4 className="text-md font-bold text-white mt-2 font-sans">
                          {order.tableNumber === 'Takeaway' ? 'طلب سفري 🚗' : `طاولة ${order.tableNumber} 🪑`}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400 font-semibold">
                        {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Ordered items checklist */}
                    <div className="space-y-2 py-2 flex-grow">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <div>
                            <span className="text-xs font-bold text-white">{item.name}</span>
                            {item.notes && (
                              <span className="block text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md mt-1 font-semibold border border-amber-500/20">
                                ملاحظة العميل: {item.notes}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-extrabold text-slate-300 shrink-0">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions and Prep time configuration */}
                    <div className="border-t border-white/5 pt-4 space-y-4">
                      
                      {/* Set Minutes Selector */}
                      <div>
                        <label className="block text-slate-300 text-xs font-bold mb-2 text-right">
                          تحديد وقت التحضير (بالدقائق):
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[5, 10, 15, 20, 25, 30].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => handleSetPrepTime(order.id, mins)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentPrepTime === mins
                                  ? 'bg-amber-500 text-black shadow-lg font-bold'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                              }`}
                            >
                              {mins} دقيقة
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Execute Acceptance */}
                      <div className="flex space-x-3 space-x-reverse pt-2">
                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          disabled={updatingId === order.id}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-md transition-all cursor-pointer"
                        >
                          <Play className="h-4 w-4 shrink-0 text-black" />
                          <span>اعتماد وقبول وبدء المؤقت ({currentPrepTime} د)</span>
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={updatingId === order.id}
                          className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          title="إلغاء الطلب"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'preparing' && (
        <div className="space-y-6">
          {preparingOrders.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md p-12 rounded-3xl border border-white/10 text-center text-slate-400 shadow-2xl">
              <Flame className="h-12 w-12 mx-auto mb-3 opacity-30 text-amber-500 animate-pulse" />
              <p className="text-sm font-bold text-white font-sans">لا توجد طلبات قيد التحضير حالياً</p>
              <p className="text-xs text-slate-400 mt-1">بمجرد اعتماد وقبول أي طلب جديد سيظهر هنا مع مؤقت عد تنازلي.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {preparingOrders.map((order) => {
                
                // Calculate elapsed time
                const startTime = order.acceptedAt ? new Date(order.acceptedAt).getTime() : Date.now();
                const totalDurationMs = (order.estimatedTimeMinutes || 15) * 60 * 1000;
                const endTime = startTime + totalDurationMs;
                const remainingSecs = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
                const remainingMins = Math.floor(remainingSecs / 60);

                return (
                  <div key={order.id} className="bg-[#121214]/60 backdrop-blur-md border border-amber-500/20 shadow-2xl p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all animate-fade-in">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-white/5 pb-3">
                      <div>
                        <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-md text-xs font-bold border border-amber-500/20">
                          طلب رقم: #{formatOrderId(order.id)}
                        </span>
                        <h4 className="text-md font-bold text-white mt-2 font-sans">
                          {order.tableNumber === 'Takeaway' ? 'طلب سفري 🚗' : `طاولة ${order.tableNumber} 🪑`}
                        </h4>
                      </div>
                      <div className="text-left">
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 space-x-reverse">
                          <Clock className="h-3.5 w-3.5 animate-spin-slow text-amber-400" />
                          <span>المؤقت: {order.estimatedTimeMinutes} د</span>
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 py-2 flex-grow">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <div>
                            <span className="text-xs font-bold text-white">{item.name}</span>
                            {item.notes && (
                              <span className="block text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md mt-1 font-semibold border border-amber-500/20">
                                ملاحظة: {item.notes}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-extrabold text-slate-300">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Progress details */}
                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-300 font-semibold">المدة المتبقية التقديرية:</span>
                      {remainingSecs > 0 ? (
                        <span className="text-amber-400 text-sm font-extrabold font-sans">
                          {remainingMins} د و {remainingSecs % 60} ث
                        </span>
                      ) : (
                        <span className="text-rose-400 text-xs font-bold animate-pulse">انتهى الوقت المقدر! جاهز؟</span>
                      )}
                    </div>

                    {/* Mark Ready trigger */}
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      disabled={updatingId === order.id}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 space-x-reverse shadow-md transition-all cursor-pointer"
                    >
                      <Check className="h-4.5 w-4.5 text-black" />
                      <span>اكتمل الطهي وجاهز للاستلام! 📦</span>
                    </button>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="space-y-6">
          {completedOrders.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md p-12 rounded-3xl border border-white/10 text-center text-slate-400 shadow-2xl">
              <Check className="h-12 w-12 mx-auto mb-3 opacity-30 text-amber-500" />
              <p className="text-sm font-bold text-white font-sans">لا توجد طلبات منتهية بعد</p>
              <p className="text-xs text-slate-400 mt-1">عند قيامك بتجهيز أي طلب وتجهيزه سيتم إدراجه هنا كأرشيف للطبخ.</p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="p-4 font-bold">رقم الطلب</th>
                      <th className="p-4 font-bold">موقع الجلوس</th>
                      <th className="p-4 font-bold">أصناف الطعام</th>
                      <th className="p-4 font-bold">تاريخ ووقت التحضير</th>
                      <th className="p-4 font-bold">الإجمالي</th>
                      <th className="p-4 font-bold">حالة التسليم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {completedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5">
                        <td className="p-4 font-bold text-white">#{formatOrderId(order.id)}</td>
                        <td className="p-4 font-semibold">
                          {order.tableNumber === 'Takeaway' ? 'سفري 🚗' : `طاولة ${order.tableNumber}`}
                        </td>
                        <td className="p-4 max-w-xs truncate font-medium text-slate-300">
                          {order.items.map(i => `${i.name} (${i.quantity})`).join('، ')}
                        </td>
                        <td className="p-4 font-medium text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          {order.completedAt && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-md mr-1.5 font-bold">
                              جاهز: {new Date(order.completedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-extrabold text-amber-500">{order.total.toFixed(2)} ج.م</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            order.status === OrderStatus.DELIVERED
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          }`}>
                            {order.status === OrderStatus.DELIVERED ? 'تم الاستلام بالهناء والشفاء' : 'جاهز وبانتظار التسليم'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
