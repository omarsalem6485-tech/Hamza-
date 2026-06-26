/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Order, OrderStatus, InventoryItem, Review } from './src/types';
import { MENU_ITEMS } from './src/data/menu';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Initial Inventory values
const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'chicken', name: 'صدور دجاج', quantity: 45.5, unit: 'كجم', minStock: 10 },
  { id: 'meat', name: 'لحم بلدي مفروم', quantity: 25.0, unit: 'كجم', minStock: 8 },
  { id: 'bread', name: 'خبز صاج سوري', quantity: 180, unit: 'رغيف', minStock: 30 },
  { id: 'potato', name: 'بطاطس للتحمير', quantity: 70.0, unit: 'كجم', minStock: 15 },
  { id: 'garlic', name: 'ثومية حمزة سرية', quantity: 20.0, unit: 'لتر', minStock: 5 },
  { id: 'cheese', name: 'جبنة موزاريلا', quantity: 12.0, unit: 'كجم', minStock: 4 }
];

// Initial reviews to populate the manager dashboard
const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    orderId: 'ord_101',
    rating: 5,
    comment: 'الشاورما دبل خطيرة والخلطة تجنن! الثومية مظبوطة جداً والتجهيز سريع.',
    tableNumber: 'الطاولة 3',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hours ago
  },
  {
    id: 'rev_2',
    orderId: 'ord_102',
    rating: 4,
    comment: 'كباب حلبي رائع ولحمة بلدي طازة، لكن اتأخر شوية صغيرة في التحضير. يستاهل التجربة!',
    tableNumber: 'سفري (تيك أواي)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    id: 'rev_3',
    orderId: 'ord_103',
    rating: 5,
    comment: 'أحسن مكان بتقدم عرايس لحم بالجبنة في المنطقة! تحفة!',
    tableNumber: 'الطاولة 1',
    createdAt: new Date(Date.now() - 1800000).toISOString() // 30 mins ago
  }
];

// Initial finished orders to populate manager dashboard with revenue
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_101',
    items: [
      { menuItemId: 'sh1', name: 'شاورما سوبر دبل', price: 95.00, quantity: 2, notes: 'زيادة مخلل وثومية' },
      { menuItemId: 'sd1', name: 'طبق بطاطس محمرة كرسبي', price: 40.00, quantity: 1 }
    ],
    total: 230.00,
    tableNumber: 'الطاولة 3',
    status: OrderStatus.DELIVERED,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    acceptedAt: new Date(Date.now() - 3600000 * 3 + 120000).toISOString(),
    estimatedTimeMinutes: 15,
    completedAt: new Date(Date.now() - 3600000 * 3 + 900000).toISOString(),
    isPaid: true,
    rating: 5,
    reviewText: 'الشاورما دبل خطيرة والخلطة تجنن! الثومية مظبوطة جداً والتجهيز سريع.'
  },
  {
    id: 'ord_102',
    items: [
      { menuItemId: 'gr1', name: 'كباب حلبي بالخلطة', price: 175.00, quantity: 1, notes: 'بدون بصل' },
      { menuItemId: 'dr2', name: 'ليمون نعناع فريش', price: 35.00, quantity: 1 }
    ],
    total: 210.00,
    tableNumber: 'سفري',
    status: OrderStatus.DELIVERED,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    acceptedAt: new Date(Date.now() - 3600000 * 2 + 180000).toISOString(),
    estimatedTimeMinutes: 20,
    completedAt: new Date(Date.now() - 3600000 * 2 + 1300000).toISOString(),
    isPaid: true,
    rating: 4,
    reviewText: 'كباب حلبي رائع ولحمة بلدي طازة، لكن اتأخر شوية صغيرة في التحضير. يستاهل التجربة!'
  },
  {
    id: 'ord_103',
    items: [
      { menuItemId: 'gr2', name: 'عرايس لحم بالجبنة', price: 120.00, quantity: 1 },
      { menuItemId: 'dr1', name: 'كنافة نابلسية بالجبنة', price: 65.00, quantity: 1 }
    ],
    total: 185.00,
    tableNumber: 'الطاولة 1',
    status: OrderStatus.DELIVERED,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    acceptedAt: new Date(Date.now() - 1800000 + 60000).toISOString(),
    estimatedTimeMinutes: 12,
    completedAt: new Date(Date.now() - 1800000 + 720000).toISOString(),
    isPaid: true,
    rating: 5,
    reviewText: 'أحسن مكان بتقدم عرايس لحم بالجبنة في المنطقة! تحفة!'
  },
  {
    id: 'ord_104',
    items: [
      { menuItemId: 'sh2', name: 'وجبة عربي فرط حمزة', price: 130.00, quantity: 1 }
    ],
    total: 130.00,
    tableNumber: 'الطاولة 2',
    status: OrderStatus.PREPARING,
    createdAt: new Date(Date.now() - 600000).toISOString(),
    acceptedAt: new Date(Date.now() - 540000).toISOString(),
    estimatedTimeMinutes: 15,
    isPaid: false
  },
  {
    id: 'ord_105',
    items: [
      { menuItemId: 'sh3', name: 'صاروخ شاورما جبنة', price: 110.00, quantity: 1 }
    ],
    total: 110.00,
    tableNumber: 'الطاولة 4',
    status: OrderStatus.PENDING,
    createdAt: new Date(Date.now() - 120000).toISOString(),
    isPaid: false
  }
];

// Load Database State
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // Fallback fields
      if (!parsed.orders) parsed.orders = INITIAL_ORDERS;
      if (!parsed.inventory) parsed.inventory = INITIAL_INVENTORY;
      if (!parsed.reviews) parsed.reviews = INITIAL_REVIEWS;
      return parsed;
    }
  } catch (error) {
    console.error('Error reading db.json, resetting database:', error);
  }

  // Write default state
  const defaultState = {
    orders: INITIAL_ORDERS,
    inventory: INITIAL_INVENTORY,
    reviews: INITIAL_REVIEWS
  };
  saveDb(defaultState);
  return defaultState;
}

// Save Database State
function saveDb(state: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to db.json:', error);
  }
}

// REST APIs
app.get('/api/state', (req, res) => {
  const state = loadDb();
  res.json(state);
});

// Helper to get local date in Cairo (Africa/Cairo) timezone as YYYY-MM-DD
function getCairoDateString(isoString?: string) {
  const date = isoString ? new Date(isoString) : new Date();
  return date.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); // returns "YYYY-MM-DD"
}

// Helper to generate the next sequential order ID that resets to 1 each day
function getNextOrderSeqId(): string {
  const db = loadDb();
  const todayStr = getCairoDateString();
  
  // Filter all orders created on the same Cairo calendar day
  const todayOrders = db.orders.filter((o: Order) => {
    if (!o.createdAt) return false;
    return getCairoDateString(o.createdAt) === todayStr;
  });

  // Find the max sequence number among today's orders
  let maxSeq = 0;
  for (const o of todayOrders) {
    if (o.id && o.id.includes('-')) {
      const parts = o.id.split('-');
      const seq = parseInt(parts[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    } else {
      const seq = parseInt(o.id, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const dateCompact = todayStr.replace(/-/g, ''); // e.g. "20260626"
  return `${dateCompact}-${nextSeq}`;
}

// Submit a new order
app.post('/api/orders', (req, res) => {
  const { items, tableNumber, total } = req.body;
  if (!items || !items.length || !tableNumber) {
    return res.status(400).json({ error: 'البيانات المرسلة غير مكتملة' });
  }

  const db = loadDb();

  // Validate ingredient inventory levels
  const insufficientItems: string[] = [];
  const requiredMaterials: { [id: string]: number } = {};

  for (const item of items) {
    const menuItem = MENU_ITEMS.find(m => m.id === item.menuItemId);
    if (!menuItem) continue;

    for (const ing of menuItem.ingredients) {
      const needed = ing.amount * item.quantity;
      requiredMaterials[ing.id] = (requiredMaterials[ing.id] || 0) + needed;
    }
  }

  // Check inventory stock levels
  for (const [ingId, amount] of Object.entries(requiredMaterials)) {
    const invItem = db.inventory.find((i: any) => i.id === ingId);
    if (!invItem || invItem.quantity < amount) {
      const name = invItem ? invItem.name : ingId;
      insufficientItems.push(name);
    }
  }

  if (insufficientItems.length > 0) {
    return res.status(400).json({
      error: `عذراً! المكونات التالية غير كافية لتحضير طلبك حالياً: ${insufficientItems.join('، ')}`
    });
  }

  // Deduct Inventory Stock
  for (const [ingId, amount] of Object.entries(requiredMaterials)) {
    const invItem = db.inventory.find((i: any) => i.id === ingId);
    if (invItem) {
      invItem.quantity = Math.max(0, parseFloat((invItem.quantity - amount).toFixed(3)));
    }
  }

  // Create Order Object with daily sequential ID
  const orderId = getNextOrderSeqId();
  const newOrder: Order = {
    id: orderId,
    items,
    total: parseFloat(total),
    tableNumber,
    status: OrderStatus.PENDING,
    createdAt: new Date().toISOString(),
    isPaid: false
  };

  db.orders.unshift(newOrder); // Add to beginning
  saveDb(db);

  res.json({ message: 'تم إرسال الطلب بنجاح إلى المطبخ!', order: newOrder, state: db });
});

// Update order status or preparation time (Chef / Cashier action)
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, estimatedTimeMinutes, isPaid } = req.body;

  const db = loadDb();
  const orderIdx = db.orders.findIndex((o: Order) => o.id === id);

  if (orderIdx === -1) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  const order = db.orders[orderIdx];

  // If status transitions to preparing and estimatedTimeMinutes is provided
  if (status === OrderStatus.PREPARING) {
    order.status = OrderStatus.PREPARING;
    order.acceptedAt = new Date().toISOString();
    if (estimatedTimeMinutes !== undefined) {
      order.estimatedTimeMinutes = Number(estimatedTimeMinutes);
    }
  } else if (status === OrderStatus.READY) {
    order.status = OrderStatus.READY;
    order.completedAt = new Date().toISOString();
  } else if (status === OrderStatus.DELIVERED) {
    order.status = OrderStatus.DELIVERED;
  } else if (status === OrderStatus.CANCELLED) {
    // If cancelled, we should refund ingredients to inventory!
    if (order.status !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        const menuItem = MENU_ITEMS.find(m => m.id === item.menuItemId);
        if (menuItem) {
          for (const ing of menuItem.ingredients) {
            const refundAmount = ing.amount * item.quantity;
            const invItem = db.inventory.find((i: any) => i.id === ing.id);
            if (invItem) {
              invItem.quantity = parseFloat((invItem.quantity + refundAmount).toFixed(3));
            }
          }
        }
      }
    }
    order.status = OrderStatus.CANCELLED;
  }

  // Payment update (Cashier action)
  if (isPaid !== undefined) {
    order.isPaid = !!isPaid;
  }

  saveDb(db);
  res.json({ message: 'تم تحديث حالة الطلب بنجاح', order, state: db });
});

// Rate / Review an order (Customer action)
app.post('/api/orders/:id/rate', (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'التقييم يجب أن يكون بين 1 و 5 نجوم' });
  }

  const db = loadDb();
  const orderIdx = db.orders.findIndex((o: Order) => o.id === id);

  if (orderIdx === -1) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  const order = db.orders[orderIdx];
  order.rating = rating;
  order.reviewText = comment || '';

  // Add to reviews array
  const reviewId = 'rev_' + Math.floor(1000 + Math.random() * 9000);
  const newReview: Review = {
    id: reviewId,
    orderId: id,
    rating,
    comment: comment || '',
    tableNumber: order.tableNumber,
    createdAt: new Date().toISOString()
  };

  db.reviews.unshift(newReview);
  saveDb(db);

  res.json({ message: 'شكراً لك على تقييمك لمطعم حمزة السوري!', order, state: db });
});

// Refill Inventory Ingredient (Manager action)
app.post('/api/inventory/refill', (req, res) => {
  const { id, amount } = req.body;
  if (!id || amount === undefined || amount <= 0) {
    return res.status(400).json({ error: 'بيانات التعبئة غير صالحة' });
  }

  const db = loadDb();
  const item = db.inventory.find((i: any) => i.id === id);

  if (!item) {
    return res.status(404).json({ error: 'المكون غير موجود في المخزن' });
  }

  item.quantity = parseFloat((item.quantity + Number(amount)).toFixed(3));
  saveDb(db);

  res.json({ message: `تمت إعادة تعبئة ${item.name} بنجاح!`, inventory: db.inventory, state: db });
});

// Update minStock thresholds or stock directly (Manager action)
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { quantity, minStock } = req.body;

  const db = loadDb();
  const item = db.inventory.find((i: any) => i.id === id);

  if (!item) {
    return res.status(404).json({ error: 'المكون غير موجود' });
  }

  if (quantity !== undefined) item.quantity = parseFloat(Number(quantity).toFixed(3));
  if (minStock !== undefined) item.minStock = Number(minStock);

  saveDb(db);
  res.json({ message: 'تم تحديث بيانات المخزون', item, state: db });
});

// Reset database to initial mock values (Manager safety reset)
app.post('/api/reset', (req, res) => {
  const db = {
    orders: INITIAL_ORDERS,
    inventory: INITIAL_INVENTORY,
    reviews: INITIAL_REVIEWS
  };
  saveDb(db);
  res.json({ message: 'تم إعادة تهيئة قاعدة البيانات بنجاح', state: db });
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hamza Al-Souri Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
