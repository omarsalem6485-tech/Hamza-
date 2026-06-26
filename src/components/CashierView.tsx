/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Landmark, Receipt, Search, CheckCircle2, DollarSign, Clock, 
  ChevronLeft, Printer, ShieldCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { Order, OrderStatus, formatOrderId } from '../types';

interface CashierViewProps {
  orders: Order[];
  refreshState: () => void;
}

export default function CashierView({ orders, refreshState }: CashierViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Poll state every 4 seconds to sync transactions
  useEffect(() => {
    refreshState();
    const interval = setInterval(() => {
      refreshState();
    }, 4000);
    return () => clearInterval(interval);
  }, [refreshState]);

  // Filter orders based on query (Order ID or Table)
  const filteredOrders = orders.filter(o => {
    const formattedId = formatOrderId(o.id);
    const matchesSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          formattedId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.tableNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleMarkAsPaid = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPaid: true,
          // If already Ready, automatically advance to Delivered on payment if helpful,
          // but let's keep it safe or advance to Delivered if chef completed it
          status: orders.find(o => o.id === orderId)?.status === OrderStatus.READY 
            ? OrderStatus.DELIVERED 
            : undefined
        })
      });

      if (response.ok) {
        refreshState();
      }
    } catch (err) {
      console.error('Error marking paid:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: OrderStatus.DELIVERED
        })
      });

      if (response.ok) {
        refreshState();
      }
    } catch (err) {
      console.error('Error marking delivered:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in print:bg-white print:p-0">
      
      {/* Page Header (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-6 mb-6 gap-4 print:hidden">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-amber-500/10 text-amber-500 p-3 rounded-2xl border border-amber-500/20">
            <Landmark className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-white">صندوق الكاشير والمحاسبة</h2>
            <p className="text-xs text-slate-400 mt-1">تأكيد تسوية الحسابات، طباعة الفواتير، وتثبيت سداد الطلبات المكتملة</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button 
            onClick={refreshState}
            className="flex items-center space-x-1.5 space-x-reverse bg-white/5 hover:bg-white/10 text-amber-500 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>تحديث الحسابات</span>
          </button>
        </div>
      </div>

      {/* Grid Layout (Two columns: List and Receipt viewer) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* RIGHT COLUMN: Search and Orders List (Hidden on print) */}
        <div className="lg:col-span-7 space-y-6 print:hidden">
          
          {/* Search input */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-lg flex items-center space-x-2 space-x-reverse">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="البحث برقم الطلب (مثال: #1) أو اسم الطاولة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 focus:outline-hidden text-xs text-white"
            />
          </div>

          {/* Orders Table/List */}
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-sm font-bold text-white font-sans">جدول الفواتير والطلبات الحالية</h3>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30 text-amber-500" />
                <p className="text-xs font-bold text-slate-300">لا توجد طلبات تطابق بحثك</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase tracking-wider">
                      <th className="p-4 font-bold">الطلب</th>
                      <th className="p-4 font-bold">الموقع</th>
                      <th className="p-4 font-bold">الحالة</th>
                      <th className="p-4 font-bold">الإجمالي</th>
                      <th className="p-4 font-bold">الحساب</th>
                      <th className="p-4 font-bold">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredOrders.map((order) => (
                      <tr 
                        key={order.id} 
                        id={`cashier-row-${order.id}`}
                        className={`hover:bg-white/5 transition-all cursor-pointer ${
                          selectedOrderId === order.id ? 'bg-amber-500/10 border-l border-amber-500' : ''
                        }`}
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <td className="p-4 font-bold text-white">#{formatOrderId(order.id)}</td>
                        <td className="p-4 font-bold text-slate-300">
                          {order.tableNumber === 'Takeaway' ? 'سفري 🚗' : `طاولة ${order.tableNumber}`}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                            order.status === OrderStatus.PENDING ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            order.status === OrderStatus.PREPARING ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            order.status === OrderStatus.READY ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' :
                            order.status === OrderStatus.DELIVERED ? 'bg-white/5 text-slate-400 border-white/5' : 'bg-rose-950/40 text-rose-400 border-rose-900/30'
                          }`}>
                            {order.status === OrderStatus.PENDING ? 'جديد' :
                             order.status === OrderStatus.PREPARING ? 'قيد الطبخ' :
                             order.status === OrderStatus.READY ? 'جاهز للاستلام 📦' :
                             order.status === OrderStatus.DELIVERED ? 'مُسلم للعميل' : 'ملغي ❌'}
                          </span>
                        </td>
                        <td className="p-4 font-extrabold text-amber-500">{order.total.toFixed(2)} ج.م</td>
                        <td className="p-4">
                          {order.isPaid ? (
                            <span className="text-emerald-400 font-bold flex items-center space-x-1 space-x-reverse text-[10px]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>مدفوع</span>
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center space-x-1 space-x-reverse text-[10px]">
                              <Clock className="h-3.5 w-3.5" />
                              <span>غير مدفوع</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(order.id);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-bold text-xs cursor-pointer"
                          >
                            عرض الفاتورة 📄
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* LEFT COLUMN: Thermal Invoice Viewer */}
        <div className="lg:col-span-5">
          {selectedOrder ? (
            <div className="space-y-6">
              
              {/* Receipt Thermal Template Container */}
              <div className="bg-[#121214]/90 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 animate-fade-in border-t-8 border-t-amber-500 relative">
                
                {/* Simulated receipt tear effect */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-repeat-x bg-white/5" />
                
                {/* Print view branding */}
                <div className="text-center space-y-2 border-b border-dashed border-white/10 pb-5">
                  <h3 className="text-xl font-extrabold tracking-tight font-sans text-white">مطعم حمزة السوري</h3>
                  <p className="text-xs text-slate-300 font-medium">البيت السوري الأصيل لجميع المأكولات</p>
                  <p className="text-[10px] text-slate-400">شارع الشاورما السورية الأصيلة - الفرع الرئيسي</p>
                  <p className="text-[10px] text-slate-400">تليفون: 01002003004 | الرقم الضريبي: 543-982-120</p>
                </div>

                {/* Receipt Metadata */}
                <div className="py-4 text-xs text-slate-300 space-y-1.5 border-b border-dashed border-white/10">
                  <div className="flex justify-between">
                    <span className="font-semibold">رقم الفاتورة:</span>
                    <span className="font-bold text-white">#{formatOrderId(selectedOrder.id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">تاريخ الطلب:</span>
                    <span>{new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG')} {new Date(selectedOrder.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">موقع الزبون:</span>
                    <span className="font-bold text-white">
                      {selectedOrder.tableNumber === 'Takeaway' ? 'طلب سفري 🚗' : `طاولة ${selectedOrder.tableNumber}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">طريقة الدفع:</span>
                    <span className="font-bold text-amber-400">نقدي / فيزا (عند الصندوق)</span>
                  </div>
                </div>

                {/* Receipt Items */}
                <div className="py-4 border-b border-dashed border-white/10">
                  <div className="text-xs font-bold text-slate-500 mb-2.5 flex justify-between">
                    <span>الصنف</span>
                    <div className="flex space-x-8 space-x-reverse">
                      <span>الكمية</span>
                      <span>الإجمالي</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="text-xs text-white flex justify-between">
                        <div className="max-w-[180px]">
                          <span className="font-bold">{item.name}</span>
                          {item.notes && (
                            <span className="block text-[10px] text-amber-400">({item.notes})</span>
                          )}
                        </div>
                        <div className="flex space-x-8 space-x-reverse font-sans font-semibold">
                          <span className="text-slate-400">×{item.quantity}</span>
                          <span className="font-bold text-white">{(item.price * item.quantity).toFixed(2)} ج.م</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="py-4 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>قيمة المبيعات</span>
                    <span>{(selectedOrder.total / 1.14).toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ضريبة القيمة المضافة (14%)</span>
                    <span>{(selectedOrder.total - (selectedOrder.total / 1.14)).toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-white pt-3 border-t border-dashed border-white/10">
                    <span>المبلغ المطلوب</span>
                    <span className="text-lg text-amber-500 font-extrabold">{selectedOrder.total.toFixed(2)} ج.م</span>
                  </div>
                </div>

                {/* Receipt Footer */}
                <div className="text-center pt-5 border-t border-dashed border-white/10 space-y-1.5">
                  <div className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold border ${
                    selectedOrder.isPaid 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                  }`}>
                    {selectedOrder.isPaid ? '⭐️ تمت تسوية الحساب بالكامل ⭐️' : '⚠️ بانتظار استلام السداد المالي ⚠️'}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">فاتورة ضريبية مبسطة - نتشرف بزيارتكم دائماً</p>
                  <p className="text-[9px] text-slate-500">نظام كاشير مطعم حمزة السوري v2.1</p>
                </div>

              </div>

              {/* Action Buttons for Cashier (Hidden on print) */}
              <div className="flex flex-col sm:flex-row gap-3 print:hidden">
                {!selectedOrder.isPaid ? (
                  <button
                    id={`btn-cashier-pay-${selectedOrder.id}`}
                    onClick={() => handleMarkAsPaid(selectedOrder.id)}
                    disabled={updatingId === selectedOrder.id}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 space-x-reverse shadow-md transition-all cursor-pointer"
                  >
                    <DollarSign className="h-5 w-5" />
                    <span>تأكيد استلام الحساب المالي (مدفوع) 💸</span>
                  </button>
                ) : (
                  <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-3 flex items-center justify-center space-x-2 space-x-reverse text-xs font-bold">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span>تم الدفع والتسوية المالية بنجاح</span>
                  </div>
                )}

                {/* Delivery check */}
                {selectedOrder.status !== OrderStatus.DELIVERED && selectedOrder.status !== OrderStatus.CANCELLED && (
                  <button
                    onClick={() => handleMarkAsDelivered(selectedOrder.id)}
                    disabled={updatingId === selectedOrder.id}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 space-x-reverse shadow-md transition-all cursor-pointer"
                  >
                    <span>تسليم للزبون 📦</span>
                  </button>
                )}

                <button
                  onClick={handlePrintReceipt}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer"
                >
                  <Printer className="h-4.5 w-4.5" />
                  <span>طباعة الفاتورة</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-12 text-center border border-white/10 text-slate-400 h-[400px] flex flex-col justify-center items-center print:hidden shadow-2xl">
              <Receipt className="h-14 w-14 mb-4 opacity-25 text-amber-500" />
              <h4 className="text-sm font-bold text-white font-sans">لم يتم اختيار أي فاتورة</h4>
              <p className="text-xs text-slate-400 mt-2 max-w-[250px] mx-auto">
                اختر أي طلب أو طاولة من الجدول الجانبي لعرض فواتيرهم المفصلة واستلام النقدية أو طباعة الفواتير.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
