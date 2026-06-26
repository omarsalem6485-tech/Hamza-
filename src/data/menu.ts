/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem } from '../types';

export const MENU_ITEMS: MenuItem[] = [
  // فئة الشاورما
  {
    id: 'sh1',
    name: 'شاورما سوبر دبل',
    description: 'شاورما دجاج حمزة اللذيذة بخبز الصاج السوري المقرمش، غرقانة ثومية وبطاطس وخيار مخلل.',
    price: 95.00,
    category: 'الشاورما السورية',
    image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=500&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'chicken', amount: 0.15 }, // 150g chicken
      { id: 'bread', amount: 1 },      // 1 Syrian bread
      { id: 'garlic', amount: 0.02 },  // 20ml garlic sauce
      { id: 'potato', amount: 0.05 }   // 50g potatoes inside
    ],
    isAvailable: true
  },
  {
    id: 'sh2',
    name: 'وجبة عربي فرط حمزة',
    description: 'شاورما دجاج مقطعة عربي، تقدم مع بطاطس محمرة كرسبي، ثومية، مخلل، وحمص بالزيت.',
    price: 130.00,
    category: 'الشاورما السورية',
    image: 'https://images.unsplash.com/photo-1642683215897-5233f2c95350?w=500&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'chicken', amount: 0.22 }, // 220g chicken
      { id: 'bread', amount: 2 },      // 2 breads
      { id: 'garlic', amount: 0.04 },  // 40ml garlic sauce
      { id: 'potato', amount: 0.12 }   // 120g potatoes
    ],
    isAvailable: true
  },
  {
    id: 'sh3',
    name: 'صاروخ شاورما جبنة',
    description: 'رول شاورما دجاج عملاق مغطى بجبنة الموزاريلا السايحة مع الثومية والبطاطس.',
    price: 110.00,
    category: 'الشاورما السورية',
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'chicken', amount: 0.18 }, // 180g chicken
      { id: 'bread', amount: 1 },      // 1 bread
      { id: 'garlic', amount: 0.025 }, // 25ml garlic sauce
      { id: 'cheese', amount: 0.06 }   // 60g mozzarella
    ],
    isAvailable: true
  },

  // فئة المشويات الحلبي
  {
    id: 'gr1',
    name: 'كباب حلبي بالخلطة',
    description: 'سيخين كباب لحم بلدي مفروم متبل على الطريقة الحلبية مع البقدونس والبصل والبهارات السورية.',
    price: 175.00,
    category: 'المشويات الحلبية',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'meat', amount: 0.25 },   // 250g meat
      { id: 'bread', amount: 1 }       // 1 bread
    ],
    isAvailable: true
  },
  {
    id: 'gr2',
    name: 'عرايس لحم بالجبنة',
    description: 'خبز صاج سوري محشو باللحم البلدي المفروم المتبل وجبنة الموزاريلا المشوي على الفحم.',
    price: 120.00,
    category: 'المشويات الحلبية',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'meat', amount: 0.15 },   // 150g meat
      { id: 'cheese', amount: 0.08 }, // 80g cheese
      { id: 'bread', amount: 2 }       // 2 breads
    ],
    isAvailable: true
  },
  {
    id: 'gr3',
    name: 'وجبة شيش طاووق',
    description: 'مكعبات شيش طاووق الدجاج المتبل والمشوي، يقدم مع خبز بالثومية وبطاطس وسلطة كولسلو.',
    price: 145.00,
    category: 'المشويات الحلبية',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'chicken', amount: 0.22 }, // 220g chicken
      { id: 'bread', amount: 1 },      // 1 bread
      { id: 'garlic', amount: 0.03 }   // 30ml garlic
    ],
    isAvailable: true
  },

  // فئة المقبلات
  {
    id: 'sd1',
    name: 'طبق بطاطس محمرة كرسبي',
    description: 'بطاطس مقلية ذهبية مقرمشة ومتبلة ببهارات حمزة الخاصة.',
    price: 40.00,
    category: 'المقبلات والجانبيات',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'potato', amount: 0.25 }  // 250g potatoes
    ],
    isAvailable: true
  },
  {
    id: 'sd2',
    name: 'ثومية حمزة السوري المميزة',
    description: 'علبة ثومية كريمية غنية محضرّة على الطريقة السورية الأصلية.',
    price: 15.00,
    category: 'المقبلات والجانبيات',
    image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=500&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'garlic', amount: 0.10 }  // 100ml garlic dip
    ],
    isAvailable: true
  },

  // فئة الحلويات والمشروبات
  {
    id: 'dr1',
    name: 'كنافة نابلسية بالجبنة',
    description: 'كنافة ساخنة بالجبنة العكاوي السايحة، مغطاة بالفستق الحلبي والقطر الحلو.',
    price: 65.00,
    category: 'الحلويات والمشروبات',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=500&auto=format&fit=crop&q=80',
    ingredients: [
      { id: 'cheese', amount: 0.08 }  // 80g cheese
    ],
    isAvailable: true
  },
  {
    id: 'dr2',
    name: 'ليمون نعناع فريش',
    description: 'عصير الليمون الطازج مع أوراق النعناع المنعشة والثلج المجروش.',
    price: 35.00,
    category: 'الحلويات والمشروبات',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
    ingredients: [],
    isAvailable: true
  }
];
