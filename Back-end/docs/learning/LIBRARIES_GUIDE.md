# 📚 دليل المكتبات السريع - Next.js Libraries Cheatsheet

> **مرجع سريع** لكل المكتبات اللي بتستخدمها في المشروع

---

## 🎨 shadcn/ui - UI Components

### التثبيت:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label
```

### الاستخدام:
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// مثال
<Card>
  <CardHeader>
    <CardTitle>عنوان</CardTitle>
  </CardHeader>
  <CardContent>
    <Label>الاسم</Label>
    <Input placeholder="أدخل الاسم" />
    <Button>حفظ</Button>
  </CardContent>
</Card>
```

### Variants:
```typescript
<Button variant="default">default</Button>
<Button variant="outline">outline</Button>
<Button variant="ghost">ghost</Button>
<Button variant="destructive">delete</Button>
```

**⭐ لماذا:** جاهزة، جميلة، قابلة للتخصيص

---

## 🔄 Zustand - State Management

### التثبيت:
```bash
npm install zustand
```

### الاستخدام:
```typescript
// src/stores/authStore.ts
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

// في أي component
import { useAuthStore } from '@/stores/authStore';

const user = useAuthStore((state) => state.user);
const setAuth = useAuthStore((state) => state.setAuth);
```

**⭐ لماذا:** أسهل من Redux، مافي boilerplate

---

## 🌐 Axios - HTTP Client

### التثبيت:
```bash
npm install axios
```

### الاستخدام:
```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Interceptor للـ token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// في component
import api from '@/lib/api';

const response = await api.get('/students');
const data = await api.post('/attendance/mark', { sessionId });
```

**⭐ لماذا:** أسهل من fetch، interceptors مدمجة

---

## 🔔 React Hot Toast - Notifications

### التثبيت:
```bash
npm install react-hot-toast
```

### الاستخدام:
```typescript
import toast, { Toaster } from 'react-hot-toast';

// في الـ component
<Toaster position="top-center" />

// للاستخدام
toast.success('تم بنجاح!');
toast.error('حدث خطأ!');
toast.loading('جاري التحميل...');

// مع promise
toast.promise(
  api.post('/data'),
  {
    loading: 'جاري الإرسال...',
    success: 'تم الإرسال!',
    error: 'فشل الإرسال',
  }
);
```

**⭐ لماذا:** سهلة، جميلة، خفيفة

---

## 📱 react-qr-code - Generate QR

### التثبيت:
```bash
npm install react-qr-code
```

### الاستخدام:
```typescript
import QRCode from 'react-qr-code';

const data = JSON.stringify({ sessionId: '123' });

<QRCode
  value={data}
  size={256}
  level="H" // L, M, Q, H (error correction)
  bgColor="#ffffff"
  fgColor="#000000"
/>
```

**⭐ لماذا:** بسيطة وفعالة

---

## 📷 @yudiel/react-qr-scanner - Scan QR

### التثبيت:
```bash
npm install @yudiel/react-qr-scanner
```

### الاستخدام:
```typescript
import { Scanner } from '@yudiel/react-qr-scanner';

const handleScan = (result: any) => {
  const data = JSON.parse(result[0].rawValue);
  console.log(data);
};

const handleError = (error: any) => {
  console.error(error);
};

<Scanner
  onScan={handleScan}
  onError={handleError}
  constraints={{
    facingMode: 'environment', // أو 'user' للكاميرا الأمامية
  }}
/>
```

**⭐ لماذا:** تعمل من المتصفح مباشرة

---

## 📅 date-fns - Date Formatting

### التثبيت:
```bash
npm install date-fns
```

### الاستخدام:
```typescript
import { format, formatDistance, formatRelative } from 'date-fns';
import { ar } from 'date-fns/locale';

// تنسيق عادي
format(new Date(), 'PPP', { locale: ar });
// "٢٦ يناير ٢٠٢٦"

// منذ متى
formatDistance(new Date(2026, 0, 25), new Date(), { 
  locale: ar,
  addSuffix: true 
});
// "منذ يوم واحد"

// نسبي
formatRelative(new Date(2026, 0, 25), new Date(), { locale: ar });
// "أمس في ١٠:٠٠ م"
```

**⭐ لماذا:** أقوى من moment.js وأخف

---

## 🎭 Framer Motion - Animations (Bonus)

### التثبيت:
```bash
npm install framer-motion
```

### الاستخدام:
```typescript
import { motion } from 'framer-motion';

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>

// Slide in
<motion.div
  initial={{ x: -100 }}
  animate={{ x: 0 }}
  transition={{ type: 'spring' }}
>
  Content
</motion.div>

// Scale on hover
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>

// Stagger children
<motion.ul
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {item}
    </motion.li>
  ))}
</motion.ul>
```

**⭐ لماذا:** أفضل مكتبة animations لـ React

---

## 📊 Recharts - Charts (Bonus)

### التثبيت:
```bash
npm install recharts
```

### الاستخدام:
```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'مادة 1', value: 24 },
  { name: 'مادة 2', value: 18 },
  { name: 'مادة 3', value: 30 },
];

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

**⭐ لماذا:** سهلة ومبنية على D3

---

## 🎨 React Icons - Icon Library

### التثبيت:
```bash
npm install react-icons
```

### الاستخدام:
```typescript
import { FaUser, FaSignOutAlt, FaQrcode } from 'react-icons/fa';
import { IoMdNotifications } from 'react-icons/io';
import { BiLoaderAlt } from 'react-icons/bi';

<FaUser size={24} color="#3b82f6" />
<FaSignOutAlt className="text-red-500" />
<BiLoaderAlt className="animate-spin" />
```

**أشهر المكتبات:**
- `fa` - Font Awesome
- `md` - Material Design
- `io` - Ionicons
- `bi` - Bootstrap Icons
- `ai` - Ant Design Icons

**⭐ لماذا:** آلاف الأيقونات، سهلة الاستخدام

---

## 🔍 الخلاصة - متى تستخدم أي مكتبة؟

| الحاجة | المكتبة | الاستخدام |
|-------|---------|-----------|
| UI Components | shadcn/ui | Buttons, Cards, Forms |
| State Management | Zustand | User, Auth, Global State |
| API Calls | Axios | GET, POST, PUT, DELETE |
| Notifications | React Hot Toast | Success, Error Messages |
| QR Generate | react-qr-code | عرض QR للمدرس |
| QR Scan | @yudiel/react-qr-scanner | مسح QR للطالب |
| Dates | date-fns | تنسيق التواريخ |
| Animations | Framer Motion | Page transitions, Hover |
| Charts | Recharts | Statistics, Analytics |
| Icons | React Icons | UI Icons |

---

## 🚀 Quick Start Commands

```bash
# إنشاء مشروع جديد
npx create-next-app@latest my-app

# تثبيت الأساسيات
npm install zustand axios react-hot-toast
npm install react-qr-code @yudiel/react-qr-scanner
npm install date-fns react-icons

# shadcn setup
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label

# للتطوير المتقدم (optional)
npm install framer-motion recharts
```

---

## 💡 نصائح الاستخدام

### ✅ Do's:
- استخدم shadcn/ui للـ UI - سريع وجميل
- استخدم Zustand للـ state - بسيط وفعال
- استخدم date-fns للتواريخ - قوي وخفيف
- استخدم Toast للإشعارات - تجربة مستخدم أفضل

### ❌ Don'ts:
- لا تستخدم Redux إذا ما تحتاجه - Zustand كافي
- لا تستخدم moment.js - date-fns أحدث
- لا تبني components من الصفر - shadcn جاهزة
- لا تنسى error handling في API calls

---

## 🔗 روابط مفيدة

### Documentation:
- **shadcn/ui:** https://ui.shadcn.com/
- **Zustand:** https://docs.pmnd.rs/zustand
- **Axios:** https://axios-http.com/
- **Framer Motion:** https://www.framer.com/motion/
- **Recharts:** https://recharts.org/
- **date-fns:** https://date-fns.org/

### Next.js:
- **Docs:** https://nextjs.org/docs
- **App Router:** https://nextjs.org/docs/app
- **Examples:** https://github.com/vercel/next.js/tree/canary/examples

---

**استخدم هذا الملف كـ Reference سريع! 📖**
