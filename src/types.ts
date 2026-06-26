/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum OrderStatus {
  PENDING = 'pending', // بانتظار التأكيد من الشيف
  PREPARING = 'preparing', // قيد التحضير
  READY = 'ready', // جاهز للاستلام
  DELIVERED = 'delivered', // تم الاستلام
  CANCELLED = 'cancelled' // ملغي
}

export interface MenuItemIngredient {
  id: string; // matches InventoryItem.id
  amount: number; // weight or unit count needed for 1 item
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  ingredients: MenuItemIngredient[];
  isAvailable: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  tableNumber: string; // "3" or "Takeaway" (سفري)
  status: OrderStatus;
  createdAt: string;
  acceptedAt?: string; // when chef accepts
  estimatedTimeMinutes?: number; // duration set by chef
  completedAt?: string; // when ready
  isPaid: boolean;
  rating?: number;
  reviewText?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number; // current stock level
  unit: string; // 'كجم' or 'رغيف' or 'لتر' etc.
  minStock: number; // warning threshold
}

export interface Review {
  id: string;
  orderId: string;
  rating: number;
  comment?: string;
  tableNumber: string;
  createdAt: string;
}

export interface DailyReport {
  date: string;
  totalOrdersCount: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  popularItems: { name: string; count: number; revenue: number }[];
  inventoryWarnings: string[];
}

export function formatOrderId(id: string): string {
  if (!id) return '';
  if (id.includes('-')) {
    return id.split('-')[1];
  }
  if (id.startsWith('ord_')) {
    return id.substring(4);
  }
  return id;
}
