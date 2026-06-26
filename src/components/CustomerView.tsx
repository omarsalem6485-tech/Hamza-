/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Minus, ShoppingCart, Trash2, Utensils, Clock, CheckCircle2, 
  Sparkles, Star, AlertTriangle, MessageSquare, Flame, Check, Loader2, RefreshCw
} from 'lucide-react';
import { Order, OrderStatus, MenuItem, OrderItem, InventoryItem, formatOrderId } from '../types';
import { MENU_ITEMS } from '../data/menu';

interface CustomerViewProps {
  orders: Order[];
  inventory: InventoryItem[];
  tableNumber: string;
  onTableChange: (table: string) => void;
  refreshState: () => void;
}

// Simple Countdown Timer sub-component
function CountdownTimer({ acceptedAt, durationMinutes }: { acceptedAt: string; durationMinutes: number }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(acceptedAt).getTime();
      const end = start + durationMinutes * 60 * 1000;
      const now = Date.now();
      const diff = Math.floor((end - now) / 1000);
      return diff > 0 ? diff : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = calculateTimeLeft();
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [acceptedAt, durationMinutes]);

  if (timeLeft === 0) {
    return <span className="text-emerald-600 font-bold animate-pulse">جاهز خلال لحظات...</span>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center space-x-1.5 space-x-reverse bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm font-bold shadow-xs">
      <Clock className="h-4 w-4 animate-spin-slow text-amber-600" />
      <span>المتبقي: {formattedTime}</span>
    </div>
  );
}

export default function CustomerView({ orders, inventory, tableNumber, onTableChange, refreshState }: CustomerViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<{ [menuItemId: string]: { quantity: number; notes: string } }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string>('');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Rating States
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  // Load active tracking order from local storage if available
  useEffect(() => {
    const savedOrderId = localStorage.getItem('hamza_active_order_id');
    if (savedOrderId) {
      setActiveOrderId(savedOrderId);
    }
  }, []);

  // Sync state periodically (every 5 seconds) to ensure real-time updates for customers
  useEffect(() => {
    const interval = setInterval(() => {
      refreshState();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshState]);

  // Find active tracking order details
  const activeOrder = orders.find(o => o.id === activeOrderId);

  // Helper to check if a menu item is out of stock based on inventory levels
  const isMenuItemOutOfStock = (item: MenuItem): boolean => {
    for (const ing of item.ingredients) {
      const invItem = inventory.find(i => i.id === ing.id);
      // If we don't have enough of the required ingredient for a single portion
      if (!invItem || invItem.quantity < ing.amount) {
        return true;
      }
    }
    return false;
  };

  const categories = ['all', ...Array.from(new Set(MENU_ITEMS.map(i => i.category)))];

  const filteredItems = activeCategory === 'all' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(i => i.category === activeCategory);

  const addToCart = (itemId: string) => {
    setCart(prev => {
      const current = prev[itemId] || { quantity: 0, notes: '' };
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: current.quantity + 1
        }
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      if (!prev[itemId]) return prev;
      const next = { ...prev };
      if (next[itemId].quantity <= 1) {
        delete next[itemId];
      } else {
        next[itemId] = { ...next[itemId], quantity: next[itemId].quantity - 1 };
      }
      return next;
    });
  };

  const updateNotes = (itemId: string, notes: string) => {
    setCart(prev => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], notes }
      };
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Calculate cart metrics
  const cartItems = Object.entries(cart).map(([itemId, data]) => {
    const cartData = data as { quantity: number; notes: string };
    const menuItem = MENU_ITEMS.find(m => m.id === itemId)!;
    return {
      menuItem,
      quantity: cartData.quantity,
      notes: cartData.notes
    };
  });

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.menuItem.price * item.quantity), 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cartCount === 0) return;
    if (!tableNumber) {
      setSubmitError('الرجاء اختيار رقم الطاولة أو سفري أولاً قبل إرسال الطلب.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const formattedItems = cartItems.map(item => ({
      menuItemId: item.menuItem.id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity,
      notes: item.notes
    }));

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: formattedItems,
          tableNumber: tableNumber === 'Takeaway' ? 'سفري' : `الطاولة ${tableNumber}`,
          total: cartTotal
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'حدث خطأ غير متوقع أثناء إرسال الطلب.');
      }

      setSubmitSuccessMsg('تم إرسال طلبك بنجاح للمطبخ!');
      setCart({});
      setActiveOrderId(resData.order.id);
      localStorage.setItem('hamza_active_order_id', resData.order.id);
      setReviewSubmitted(false); // Reset review
      refreshState();

      // Clear success msg after 4 seconds
      setTimeout(() => {
        setSubmitSuccessMsg('');
      }, 4000);

    } catch (err: any) {
      setSubmitError(err.message || 'فشل الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderId) return;

    try {
      const response = await fetch(`/api/orders/${activeOrderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: ratingVal,
          comment: reviewText
        })
      });

      if (response.ok) {
        setReviewSubmitted(true);
        refreshState();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const startNewOrder = () => {
    setActiveOrderId(null);
    localStorage.removeItem('hamza_active_order_id');
    setReviewText('');
    setReviewSubmitted(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* 1. Welcoming Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-black/80 to-amber-950/30 text-white p-6 sm:p-10 mb-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Utensils className="h-40 w-40 transform rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 space-x-reverse bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20 mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>نظام الطلب الذكي الفوري عبر الـ QR Code</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-sans leading-tight">
            مرحباً بك في مطعم <span className="text-amber-500">حمزة السوري</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            اطلب أشهى المأكولات السورية الأصلية من شاورما صاج مقرمشة وممشوقة، كباب حلبي متبل، وعرايس سايحة بالجبن مباشرة من جوالك وسيتكفل الشيف بتحضيرها على الفور وتتبع طلبك مباشرة!
          </p>

          {/* Quick Table Selector */}
          <div className="mt-6 flex flex-wrap items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
            <span className="text-xs sm:text-sm font-semibold text-slate-300">أين تجلس الآن؟</span>
            <div className="flex flex-wrap gap-2">
              {['1', '2', '3', '4', 'Takeaway'].map((val) => (
                <button
                  key={val}
                  id={`btn-table-select-${val}`}
                  onClick={() => onTableChange(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tableNumber === val 
                      ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                  }`}
                >
                  {val === 'Takeaway' ? 'سفري 🚗' : `طاولة ${val} 🪑`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* RIGHT COLUMN: Active tracking or Menu Grid */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Order Tracking Screen (Takes precedence if customer has placed an order) */}
          {activeOrder && (
            <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 animate-fade-in relative">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-5 gap-3">
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs font-bold">
                      الطلب: #{formatOrderId(activeOrder.id)}
                    </span>
                    <span className="bg-white/5 text-slate-300 border border-white/5 px-2.5 py-1 rounded-md text-xs font-medium">
                      {activeOrder.tableNumber === 'Takeaway' ? 'سفري' : `طاولة ${activeOrder.tableNumber}`}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-sans text-white mt-2">تتبع حالة طلبك المباشرة</h3>
                  <p className="text-xs text-slate-400 mt-1">تتحدث هذه الصفحة تلقائياً عند تغيير الشيف لحالة طلبك</p>
                </div>
                
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button 
                    onClick={refreshState}
                    className="p-2 text-slate-400 hover:text-amber-500 rounded-lg border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
                    title="تحديث الحالة الآن"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={startNewOrder}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    طلب جديد ➕
                  </button>
                </div>
              </div>

              {/* Status Stepper Tracker */}
              <div className="py-8 border-b border-white/5">
                <div className="relative">
                  
                  {/* Status Bar line background */}
                  <div className="absolute top-5 right-0 left-0 h-1 bg-white/5 rounded-full z-0">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                      style={{
                        width: 
                          activeOrder.status === OrderStatus.PENDING ? '15%' :
                          activeOrder.status === OrderStatus.PREPARING ? '50%' :
                          activeOrder.status === OrderStatus.READY ? '80%' :
                          activeOrder.status === OrderStatus.DELIVERED ? '100%' : '0%'
                      }}
                    />
                  </div>

                  {/* Status Steps */}
                  <div className="relative z-10 flex justify-between">
                    
                    {/* Step 1: Sent */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        activeOrder.status === OrderStatus.PENDING 
                          ? 'bg-amber-500 border-amber-500 text-black scale-110 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-4 ring-amber-500/20'
                          : 'bg-emerald-500 border-emerald-500 text-black'
                      }`}>
                        <Clock className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 mt-2.5">تم الإرسال</span>
                      <span className="text-[10px] text-slate-500 font-medium">بانتظار التأكيد</span>
                    </div>

                    {/* Step 2: Preparing */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        activeOrder.status === OrderStatus.PENDING 
                          ? 'bg-[#141416] border-white/10 text-slate-500'
                          : activeOrder.status === OrderStatus.PREPARING
                          ? 'bg-amber-500 border-amber-500 text-black scale-110 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-4 ring-amber-500/20 animate-pulse'
                          : 'bg-emerald-500 border-emerald-500 text-black'
                      }`}>
                        <Flame className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 mt-2.5">في المطبخ</span>
                      <span className="text-[10px] text-slate-500 font-medium">يقوم الشيف بطهيه</span>
                    </div>

                    {/* Step 3: Ready */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        (activeOrder.status === OrderStatus.PENDING || activeOrder.status === OrderStatus.PREPARING)
                          ? 'bg-[#141416] border-white/10 text-slate-500'
                          : activeOrder.status === OrderStatus.READY
                          ? 'bg-emerald-500 border-emerald-500 text-black scale-110 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/20 animate-bounce'
                          : 'bg-emerald-500 border-emerald-500 text-black'
                      }`}>
                        <Check className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 mt-2.5">جاهز للاستلام</span>
                      <span className="text-[10px] text-slate-500 font-medium">استلم طلبك الساخن</span>
                    </div>

                    {/* Step 4: Finished */}
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        activeOrder.status === OrderStatus.DELIVERED
                          ? 'bg-emerald-500 border-emerald-500 text-black scale-110 ring-4 ring-emerald-500/20'
                          : 'bg-[#141416] border-white/10 text-slate-500'
                      }`}>
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 mt-2.5">تم الاستلام</span>
                      <span className="text-[10px] text-slate-500 font-medium">بالهناء والشفاء</span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Status Explanatory Alerts */}
              <div className="mt-6 p-5 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans">
                      {activeOrder.status === OrderStatus.PENDING && '⏳ الشيف يراجع طلبك الآن لتحديد الوقت اللازم للتحضير...'}
                      {activeOrder.status === OrderStatus.PREPARING && '🔥 طلبك قيد التحضير والتجهيز حالياً بلمسات سورية أصيلة!'}
                      {activeOrder.status === OrderStatus.READY && '🎉 بشرى سارة! طلبك جاهز الآن وساخن ومقرمش! تفضل باستلامه.'}
                      {activeOrder.status === OrderStatus.DELIVERED && '❤️ بالهناء والشفاء! نأمل أن يكون طعام حمزة السوري قد نال إعجابك.'}
                      {activeOrder.status === OrderStatus.CANCELLED && '❌ نأسف جداً! تم إلغاء هذا الطلب من قبل المطبخ نظراً لعدم توفر بعض المكونات.'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeOrder.status === OrderStatus.PENDING && 'سيقوم المطبخ بقبول الطلب فوراً وتخصيص المؤقت له.'}
                      {activeOrder.status === OrderStatus.PREPARING && 'يرجى الانتظار، وسيتحول اللون للأخضر بمجرد انتهائه.'}
                      {activeOrder.status === OrderStatus.READY && 'يرجى إبراز رقم الطلب (# ' + formatOrderId(activeOrder.id) + ') للشيف لاستلام طعامك.'}
                      {activeOrder.status === OrderStatus.DELIVERED && 'يرجى التفضل بتقييم الخدمة لمساعدتنا في التطوير.'}
                    </p>
                  </div>

                  {/* Countdown display for preparation */}
                  {activeOrder.status === OrderStatus.PREPARING && activeOrder.acceptedAt && activeOrder.estimatedTimeMinutes && (
                    <CountdownTimer acceptedAt={activeOrder.acceptedAt} durationMinutes={activeOrder.estimatedTimeMinutes} />
                  )}
                </div>
              </div>

              {/* Order summary checklist */}
              <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">تفاصيل طلبك</h4>
                <div className="border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center bg-white/5">
                      <div>
                        <span className="text-sm font-bold text-white">{item.name}</span>
                        <span className="text-xs text-slate-400 mr-2">×{item.quantity}</span>
                        {item.notes && (
                          <span className="block text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md mt-1 w-fit border border-amber-500/20">
                            ملاحظة: {item.notes}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-white">{(item.price * item.quantity).toFixed(2)} ج.م</span>
                    </div>
                  ))}
                  <div className="p-4 flex justify-between items-center bg-white/10">
                    <span className="text-sm font-bold text-slate-300">الإجمالي الشامل</span>
                    <span className="text-md font-extrabold text-amber-500">{activeOrder.total.toFixed(2)} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Feedback and Ratings (Only if delivered) */}
              {activeOrder.status === OrderStatus.DELIVERED && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  {!reviewSubmitted && !activeOrder.rating ? (
                    <form onSubmit={handleRatingSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6">
                      <div className="flex items-center space-x-2 space-x-reverse mb-4">
                        <MessageSquare className="h-5 w-5 text-amber-500" />
                        <h4 className="text-sm font-bold text-white font-sans">رأيك يهمنا! قيم طعام وخدمة حمزة السوري</h4>
                      </div>

                      {/* Stars Selector */}
                      <div className="flex items-center space-x-1.5 space-x-reverse mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingVal(star)}
                            className="p-1 hover:scale-115 transition-all text-amber-400 hover:text-amber-500 cursor-pointer"
                          >
                            <Star className="h-8 w-8" fill={ratingVal >= star ? 'currentColor' : 'none'} strokeWidth={1.5} />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-500 mr-2">
                          {ratingVal === 5 && 'ممتاز جداً 🌟'}
                          {ratingVal === 4 && 'جيد جداً 👍'}
                          {ratingVal === 3 && 'مقبول 😐'}
                          {ratingVal === 2 && 'سيء 👎'}
                          {ratingVal === 1 && 'سيء جداً 😡'}
                        </span>
                      </div>

                      {/* Feedback Comment */}
                      <div className="mb-4">
                        <textarea
                          placeholder="ما هو أكثر شيء أعجبك؟ شاورما, تتبيلة الكباب, السرعة, أو الثومية المميزة..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 focus:border-transparent transition-all"
                          rows={3}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2.5 px-4 rounded-xl shadow-md text-xs transition-all cursor-pointer"
                      >
                        إرسال التقييم والملاحظات
                      </button>
                    </form>
                  ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                      <h4 className="text-md font-bold text-emerald-400 font-sans">تم إرسال تقييمك بنجاح!</h4>
                      <p className="text-xs text-slate-300 mt-1">
                        شكراً جزيلاً لثقتك ودعمك لمطعم حمزة السوري، تقييمك يساعدنا على الحفاظ على مستوانا المميز على الدوام.
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Category Tabs Selector */}
          <div className="flex space-x-1.5 space-x-reverse overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`btn-cat-${cat}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-4.5 py-2.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat === 'all' ? '🍽️ الكل' : 
                 cat === 'الشاورما السورية' ? '🌯 الشاورما' :
                 cat === 'المشويات الحلبية' ? '🍢 المشويات' :
                 cat === 'المقبلات والجانبيات' ? '🍟 المقبلات' : '🥤 الحلويات'}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="menu-grid">
            {filteredItems.map((item) => {
              const isOutOfStock = isMenuItemOutOfStock(item);
              const qtyInCart = cart[item.id]?.quantity || 0;

              return (
                <div 
                  key={item.id}
                  id={`item-card-${item.id}`}
                  className={`bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 shadow-lg hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all flex flex-col justify-between ${
                    isOutOfStock ? 'opacity-50' : ''
                  }`}
                >
                  <div>
                    {/* Item Image */}
                    <div className="relative h-44 w-full bg-white/5 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="bg-rose-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center space-x-1 space-x-reverse shadow-lg">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>نفذت الكمية اليوم</span>
                          </span>
                        </div>
                      )}
                      
                      {/* Price Badge */}
                      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md border border-white/10 text-amber-500 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-md">
                        {item.price.toFixed(2)} ج.م
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-3 right-3 bg-black/60 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10">
                        {item.category}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h4 className="text-md font-bold text-white font-sans">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-5 pt-0 border-t border-white/5 flex items-center justify-between">
                    {qtyInCart > 0 ? (
                      <div className="flex items-center space-x-3 space-x-reverse bg-amber-500/10 rounded-xl p-1.5 border border-amber-500/20 w-full justify-between">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all font-bold cursor-pointer"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-extrabold text-amber-500 px-2">{qtyInCart}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          disabled={isOutOfStock}
                          className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center hover:bg-amber-600 transition-all font-bold disabled:opacity-50 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={isOutOfStock}
                        className="w-full bg-white/5 border border-white/10 hover:bg-amber-500 hover:text-black hover:border-transparent disabled:bg-white/5 disabled:text-slate-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 space-x-reverse shadow-xs cursor-pointer"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>إضافة للطلب</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* LEFT COLUMN: Shopping Cart Panel */}
        <div className="lg:col-span-4" id="cart-sidebar">
          <div className="bg-[#121214]/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <ShoppingCart className="h-5 w-5 text-amber-500" />
                <h3 className="text-md font-bold font-sans text-white">تفاصيل سلة طلبك</h3>
              </div>
              {cartCount > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-500 flex items-center space-x-1 space-x-reverse transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>تفريغ السلة</span>
                </button>
              )}
            </div>

            {cartCount === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Utensils className="h-12 w-12 mx-auto mb-3 opacity-30 text-amber-500 animate-pulse" />
                <p className="text-xs font-bold text-slate-300">سلتك فارغة تماماً</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                  اختر من المأكولات السورية الشهية في القائمة لإضافتها لطلبك وسرعة تجهيزها.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Cart list */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.menuItem.id} className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="text-xs font-bold text-white">{item.menuItem.name}</h5>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.menuItem.price.toFixed(2)} ج.م</span>
                        </div>
                        <span className="text-xs font-extrabold text-amber-500">
                          {(item.menuItem.price * item.quantity).toFixed(2)} ج.م
                        </span>
                      </div>

                      {/* Notes input */}
                      <input
                        type="text"
                        placeholder="أضف ملاحظة خاصة للشيف... (مثال: بدون بصل)"
                        value={item.notes}
                        onChange={(e) => updateNotes(item.menuItem.id, e.target.value)}
                        className="w-full bg-black/40 px-2.5 py-1.5 border border-white/10 rounded-lg text-[10px] text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-transparent transition-all"
                      />

                      {/* Adjusters */}
                      <div className="flex justify-between items-center pt-1 border-t border-white/5">
                        <span className="text-[10px] text-slate-400 font-medium">الكمية</span>
                        <div className="flex items-center space-x-2 space-x-reverse bg-black/40 border border-white/10 rounded-md p-1">
                          <button
                            onClick={() => removeFromCart(item.menuItem.id)}
                            className="w-5 h-5 rounded-sm hover:bg-white/5 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.menuItem.id)}
                            className="w-5 h-5 rounded-sm hover:bg-white/5 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Pricing Summary */}
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>قيمة المأكولات ({cartCount} قطع)</span>
                    <span>{cartTotal.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>خدمة الصالة والضريبة (14%)</span>
                    <span className="text-emerald-400 font-medium">مشمولة ومجانية</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/10">
                    <span>المبلغ الإجمالي</span>
                    <span className="text-amber-500">{cartTotal.toFixed(2)} ج.م</span>
                  </div>
                </div>

                {/* Submitting order warnings/errors */}
                {submitError && (
                  <div className="bg-rose-950/40 border border-rose-900/30 text-rose-400 p-3.5 rounded-2xl text-[11px] flex items-start space-x-1.5 space-x-reverse font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitSuccessMsg && (
                  <div className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 p-3.5 rounded-2xl text-[11px] flex items-center space-x-1.5 space-x-reverse font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{submitSuccessMsg}</span>
                  </div>
                )}

                {/* Submission Action Button */}
                <button
                  id="btn-submit-order"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-white/5 disabled:text-slate-600 text-black font-bold py-3.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center space-x-2 space-x-reverse shadow-md hover:shadow-lg font-sans cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>جاري إرسال طلبك للفرن...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-black" />
                      <span>تأكيد وإرسال الطلب للمطبخ 🔥</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-500 text-center leading-normal">
                  بمجرد إرسال الطلب، سيقوم المطبخ باعتماده فوراً والبدء في تجهيزه.
                </p>

              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
