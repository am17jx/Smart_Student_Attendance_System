# 🎯 Next.js Practical Tasks - مهام عملية للتطبيق

> **مصممة لمستواك الحالي** - بعد إكمال كورس Next.js الكامل

**الهدف:** تطبيق ما تعلمته بشكل عملي على مشروع الحضور الإلكتروني  
**المدة المتوقعة:** 1 يوم (تطبيق مكثف)  
**المستوى:** مبتدئ → متوسط → متقدم

---

## 🛠️ المكتبات الأساسية للمشروع

### 📦 Core Libraries (ضرورية)

1. **shadcn/ui** ⭐⭐⭐⭐⭐
   - **الوظيفة:** مكونات UI جاهزة وجميلة (Buttons, Cards, Forms)
   - **لماذا:** سهلة الاستخدام، قابلة للتخصيص، مبنية على Tailwind
   - **التثبيت:**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card input label
   ```

2. **Zustand** ⭐⭐⭐⭐⭐
   - **الوظيفة:** State Management (بديل Redux لكن أبسط بكثير!)
   - **لماذا:** خفيف، سهل، مافي boilerplate
   - **التثبيت:**
   ```bash
   npm install zustand
   ```

3. **Axios** ⭐⭐⭐⭐
   - **الوظيفة:** HTTP requests للـ API
   - **لماذا:** أسهل من fetch، فيه interceptors
   - **التثبيت:**
   ```bash
   npm install axios
   ```

4. **React Hot Toast** ⭐⭐⭐⭐
   - **الوظيفة:** إشعارات جميلة (Success, Error)
   - **لماذا:** سهلة الاستخدام، تصميم جميل
   - **التثبيت:**
   ```bash
   npm install react-hot-toast
   ```

---

### 📱 QR Code Libraries

5. **react-qr-code** ⭐⭐⭐⭐
   - **الوظيفة:** عرض QR Code
   - **الاستخدام:** للمدرس - عرض QR للحصة
   ```bash
   npm install react-qr-code
   ```

6. **@yudiel/react-qr-scanner** ⭐⭐⭐⭐⭐
   - **الوظيفة:** مسح QR Code
   - **الاستخدام:** للطالب - مسح QR للحضور
   ```bash
   npm install @yudiel/react-qr-scanner
   ```

---

### 🎨 UI Enhancement Libraries (اختيارية لكن مفيدة)

7. **Framer Motion** ⭐⭐⭐⭐
   - **الوظيفة:** Animations جميلة
   - **مثال:** صفحة تدخل بحركة smooth
   ```bash
   npm install framer-motion
   ```

8. **React Icons** ⭐⭐⭐⭐⭐
   - **الوظيفة:** آلاف الأيقونات الجاهزة
   - **الاستخدام:** Icons في الواجهة
   ```bash
   npm install react-icons
   ```

9. **date-fns** ⭐⭐⭐⭐
   - **الوظيفة:** تنسيق التواريخ
   - **مثال:** "منذ ساعتين"، "2024/01/26"
   ```bash
   npm install date-fns
   ```

---

### 🔐 Auth & Security (متقدمة)

10. **NextAuth.js** ⭐⭐⭐⭐⭐
    - **الوظيفة:** Authentication كامل
    - **ملاحظة:** راح نستخدم JWT بسيط للتعلم أولاً
    ```bash
    npm install next-auth
    ```

---

### 📊 Data & Charts (Bonus)

11. **Recharts** ⭐⭐⭐⭐
    - **الوظيفة:** رسم بياني للحضور
    - **مثال:** Chart يعرض نسبة الحضور
    ```bash
    npm install recharts
    ```

---

### 🚀 المكتبات الموصى بها لهذا المشروع

**للبداية (اليوم الأول):**
```bash
npm install zustand axios react-hot-toast
npm install react-qr-code @yudiel/react-qr-scanner
npm install react-icons date-fns
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label
```

**للتطوير (لاحقاً):**
```bash
npm install framer-motion recharts
```

---

## 📅 الجدول الزمني

| اليوم | Task | الوقت | الصعوبة |
|------|------|-------|---------|
| 1 | Setup المشروع | 1-2 ساعة | ⭐ |
| 2 | Login Page | 2-3 ساعات | ⭐⭐ |
| 3 | Student Dashboard | 3-4 ساعات | ⭐⭐⭐ |
| 4 | QR Scanner | 2-3 ساعات | ⭐⭐⭐ |
| 5 | Polish & Improve | 2-3 ساعات | ⭐⭐ |

---

## 🚀 Task 1: Setup المشروع (ابدأ هنا!)

### 🎯 الهدف:
إنشاء مشروع Next.js جديد وربطه بالـ backend الموجود.

### 📝 الخطوات:

#### الخطوة 1: إنشاء المشروع
```bash
# افتح terminal جديد (خارج مجلد Backend)
cd c:\Users\Lenovo\Desktop\myproject

# أنشئ مشروع Next.js جديد
npx create-next-app@latest attendance-frontend

# الإعدادات المطلوبة عند السؤال:
✅ TypeScript? Yes
✅ ESLint? Yes
✅ Tailwind CSS? Yes
✅ src/ directory? Yes
✅ App Router? Yes
✅ Import alias? No (اضغط Enter)
```

#### الخطوة 2: تثبيت المكتبات الأساسية
```bash
cd attendance-frontend

# المكتبات المطلوبة للمشروع
npm install axios react-hot-toast
npm install react-qr-code @yudiel/react-qr-scanner
npm install zustand

# shadcn/ui للـ UI Components
npx shadcn-ui@latest init

# عند السؤال:
✅ Style: Default
✅ Base color: Slate
✅ CSS variables: Yes
```

#### الخطوة 3: إضافة Components من shadcn
```bash
# المكونات الأساسية
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add label
```

#### الخطوة 4: إعداد Environment Variables
```bash
# أنشئ ملف .env.local في مجلد المشروع
```

**محتوى `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

#### الخطوة 5: هيكل المجلدات الأولي
```bash
# داخل مشروع Next.js
mkdir -p src/lib
mkdir -p src/components
mkdir -p src/stores
mkdir -p src/types
```

### ✅ التحقق من النجاح:
```bash
npm run dev
# افتح http://localhost:3001
# يجب أن تشوف صفحة Next.js الافتراضية
```

### 📚 ما تتعلمه:
- ✅ إنشاء مشروع Next.js
- ✅ تثبيت dependencies
- ✅ shadcn/ui setup
- ✅ Environment variables

---

## 💻 Task 2: إنشاء صفحة Login البسيطة

### 🎯 الهدف:
بناء صفحة تسجيل دخول وظيفية تتصل بالـ backend.

### 📝 الخطوات:

#### الخطوة 1: إنشاء API Client
**الملف:** `src/lib/api.ts`

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة token تلقائياً لكل request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
```

**ما تتعلمه:**
- ✅ axios instance
- ✅ interceptors
- ✅ localStorage

---

#### الخطوة 2: إنشاء Auth Store (Zustand)
**الملف:** `src/stores/authStore.ts`

```typescript
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));
```

**ما تتعلمه:**
- ✅ Zustand state management
- ✅ TypeScript interfaces
- ✅ localStorage

---

#### الخطوة 3: صفحة Login
**الملف:** `src/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, role } = response.data;
      
      setAuth(
        {
          id: response.data.user?.id || '1',
          email,
          name: response.data.user?.name || 'User',
          role,
        },
        token
      );

      toast.success('تم تسجيل الدخول بنجاح!');
      
      // Redirect based on role
      if (role === 'student') {
        router.push('/student/dashboard');
      } else if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster position="top-center" />
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            🎓 نظام الحضور الإلكتروني
          </CardTitle>
          <p className="text-gray-600 mt-2">تسجيل الدخول</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                dir="ltr"
              />
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                dir="ltr"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>للتجربة:</p>
            <p className="font-mono text-xs mt-1">
              teacher@test.com / password123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**ما تتعلمه:**
- ✅ 'use client' directive
- ✅ useState hook
- ✅ useRouter للتنقل
- ✅ Forms في Next.js
- ✅ API calls
- ✅ Toast notifications
- ✅ Loading states

---

#### الخطوة 4: تحديث الصفحة الرئيسية
**الملف:** `src/app/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // إذا في user مسجل دخول، روح للـ dashboard
    if (user) {
      router.push(`/${user.role}/dashboard`);
    } else {
      // وإلا روح للـ login
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>جاري التحميل...</p>
    </div>
  );
}
```

---

### ✅ اختبر الصفحة:
```bash
# 1. شغل Backend
cd Privacy-Preserving-Student-Attendance-1
npm run dev

# 2. شغل Frontend (terminal جديد)
cd attendance-frontend
npm run dev

# 3. افتح http://localhost:3001
# 4. جرب تسجيل دخول بـ:
#    Email: (أنشئ student/teacher من Postman)
#    Password: كلمة المرور
```

### 🐛 المشاكل المحتملة:
1. **CORS Error** → تأكد من تشغيل Backend وتفعيل CORS
2. **401 Unauthorized** → تأكد من البريد وكلمة المرور
3. **Module not found** → تأكد من تثبيت dependencies

---

## 📊 Task 3: Student Dashboard البسيط

### 🎯 الهدف:
عرض معلومات الطالب وسجل الحضور.

### 📝 الخطوات:

#### الخطوة 1: إنشاء الصفحة
**الملف:** `src/app/student/dashboard/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface AttendanceRecord {
  id: string;
  marked_at: string;
  session: {
    material: {
      name: string;
    };
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // تحقق من تسجيل الدخول
    if (!user || user.role !== 'student') {
      router.push('/login');
      return;
    }

    // جلب سجل الحضور
    fetchAttendance();
  }, [user, router]);

  const fetchAttendance = async () => {
    try {
      const response = await api.get(`/attendance/student/${user?.id}`);
      setAttendance(response.data.data.records || []);
    } catch (error) {
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold">مرحباً، {user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            تسجيل خروج
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>📊 الإحصائيات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>إجمالي الحضور:</span>
                <span className="font-bold">{attendance.length}</span>
              </div>
              <div className="flex justify-between">
                <span>الحالة:</span>
                <span className="text-green-600 font-bold">نشط</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => router.push('/student/scan-qr')}
            >
              📱 مسح QR Code
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => router.push('/student/attendance')}
            >
              📋 عرض سجل الحضور
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <div className="max-w-6xl mx-auto mt-6">
        <Card>
          <CardHeader>
            <CardTitle>📅 آخر الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>جاري التحميل...</p>
            ) : attendance.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                لا يوجد سجل حضور بعد
              </p>
            ) : (
              <div className="space-y-2">
                {attendance.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">
                        {record.session?.material?.name || 'مادة'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(record.marked_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <span className="text-green-600">✓</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**ما تتعلمه:**
- ✅ useEffect dependency array
- ✅ Conditional rendering
- ✅ Grid layout
- ✅ Date formatting
- ✅ Protected routes

---

### ✅ التحقق:
1. سجل دخول كطالب
2. يجب أن تشوف Dashboard
3. يجب أن يعرض اسمك وبريدك
4. يجب أن يعرض زر Logout

---

## 📱 Task 4: QR Code Scanner

### 🎯 الهدف:
صفحة لمسح QR Code وتسجيل الحضور.

### 📝 الخطوات:

#### الخطوة 1: صفحة الماسح
**الملف:** `src/app/student/scan-qr/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function ScanQRPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handleScan = async (result: any) => {
    if (!result || loading) return;
    
    setScanning(false);
    setLoading(true);

    try {
      // نحلل QR Code (يحتوي على sessionId)
      const data = JSON.parse(result[0].rawValue);
      const { sessionId } = data;

      // نسجل الحضور
      await api.post('/attendance/mark', {
        sessionId,
        studentId: user?.id,
      });

      toast.success('✅ تم تسجيل حضورك بنجاح!');
      
      // نرجع للـ dashboard بعد 2 ثانية
      setTimeout(() => {
        router.push('/student/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في التسجيل');
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner Error:', error);
    toast.error('خطأ في الكاميرا');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toaster position="top-center" />
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-4"
          >
            ← رجوع
          </Button>
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle>📱 مسح QR Code</CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                وجه الكاميرا نحو QR Code المعروض من المدرس
              </p>
            </CardHeader>
            
            <CardContent>
              {/* QR Scanner */}
              <div className="aspect-square bg-black rounded-lg overflow-hidden mb-4">
                {scanning ? (
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    constraints={{
                      facingMode: 'environment', // الكاميرا الخلفية
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-white">
                    {loading ? '⏳ جاري التسجيل...' : '✅ تم المسح'}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <p className="font-bold mb-2">📝 تعليمات:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>ضع QR Code في المنتصف</li>
                  <li>تأكد من وضوح الإضاءة</li>
                  <li>امسك الهاتف بثبات</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

**ما تتعلمه:**
- ✅ QR Scanner integration
- ✅ Camera permissions
- ✅ JSON parsing
- ✅ Error handling
- ✅ setTimeout للتأخير

---

## 👨‍🏫 Task 5: Teacher Dashboard

### 🎯 الهدف:
Dashboard للمدرس لعرض الحصص وإنشاء جلسات جديدة.

### 📝 الخطوات:

#### الخطوة 1: صفحة Dashboard
**الملف:** `src/app/teacher/dashboard/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Material {
  id: string;
  name: string;
  academicYear: string;
}

interface Session {
  id: string;
  date: string;
  material: Material;
  attendanceCount: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      router.push('/login');
      return;
    }

    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      // جلب المواد
      const materialsRes = await api.get(`/materials/teacher/${user?.id}`);
      setMaterials(materialsRes.data.data || []);

      // جلب الجلسات الأخيرة
      const sessionsRes = await api.get(`/sessions/teacher/${user?.id}`);
      setSessions(sessionsRes.data.data || []);
    } catch (error) {
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = (materialId: string) => {
    router.push(`/teacher/session/create?materialId=${materialId}`);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-2xl font-bold">مرحباً، د. {user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            تسجيل خروج
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
        {/* المواد الدراسية */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>📚 موادي الدراسية</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>جاري التحميل...</p>
            ) : materials.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                لا توجد مواد دراسية
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200"
                  >
                    <h3 className="font-bold text-lg mb-2">
                      {material.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {material.academicYear}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => handleCreateSession(material.id)}
                    >
                      إنشاء جلسة جديدة
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* الجلسات الأخيرة */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>📅 الجلسات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                لا توجد جلسات بعد
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                    onClick={() => router.push(`/teacher/session/${session.id}`)}
                  >
                    <div>
                      <p className="font-medium">{session.material.name}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(session.date), 'PPP', { locale: ar })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">عدد الحاضرين</p>
                      <p className="text-2xl font-bold text-green-600">
                        {session.attendanceCount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**ما تتعلمه:**
- ✅ Grid layouts متقدم
- ✅ date-fns للتواريخ
- ✅ Conditional arrays
- ✅ Query parameters
- ✅ Gradient backgrounds

---

## � Task 6: عرض QR Code للحصة

### 🎯 الهدف:
صفحة لعرض QR Code للحصة يمسحه الطلاب.

### 📝 الخطوات:

#### الخطوة 1: صفحة إنشاء جلسة
**الملف:** `src/app/teacher/session/create/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CreateSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get('materialId');
  
  const [duration, setDuration] = useState(30); // دقائق
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);

    try {
      const response = await api.post('/sessions', {
        materialId,
        duration,
      });

      const sessionId = response.data.data.id;
      
      toast.success('تم إنشاء الجلسة بنجاح!');
      
      // الانتقال لصفحة عرض QR
      router.push(`/teacher/session/${sessionId}/qr`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في الإنشاء');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>إنشاء جلسة جديدة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="duration">مدة الجلسة (بالدقائق)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={5}
              max={180}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              سيتم إغلاق الحضور تلقائياً بعد {duration} دقيقة
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'جاري الإنشاء...' : 'إنشاء'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

#### الخطوة 2: صفحة عرض QR
**الملف:** `src/app/teacher/session/[id]/qr/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface SessionData {
  id: string;
  material: {
    name: string;
  };
  createdAt: string;
  duration: number;
  attendanceCount: number;
}

export default function SessionQRPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchSession();
    
    // تحديث عدد الحاضرين كل 3 ثواني
    const interval = setInterval(fetchAttendance, 3000);
    
    return () => clearInterval(interval);
  }, [sessionId]);

  // Timer للوقت المتبقي
  useEffect(() => {
    if (!session) return;
    
    const endTime = new Date(session.createdAt).getTime() + (session.duration * 60 * 1000);
    
    const timer = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(left);
      
      if (left === 0) {
        clearInterval(timer);
        toast.success('انتهت الجلسة!');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [session]);

  const fetchSession = async () => {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      setSession(response.data.data);
      setAttendanceCount(response.data.data.attendanceCount);
    } catch (error) {
      toast.error('خطأ في جلب البيانات');
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await api.get(`/sessions/${sessionId}/attendance`);
      setAttendanceCount(response.data.data.count);
    } catch (error) {
      // silent fail
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  const qrData = JSON.stringify({ sessionId });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">{session.material.name}</h1>
          <Button variant="outline" onClick={() => router.back()}>
            ← رجوع للـ Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* QR Code */}
          <Card className="md:col-span-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">امسح هذا الـ QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <QRCode
                  value={qrData}
                  size={300}
                  level="H"
                />
              </div>
              
              <p className="mt-6 text-gray-600 text-center">
                على الطلاب استخدام تطبيق الحضور لمسح هذا الكود
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            {/* Timer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">⏱️ الوقت المتبقي</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className={`text-5xl font-bold ${
                  timeLeft < 60 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatTime(timeLeft)}
                </p>
              </CardContent>
            </Card>

            {/* Count */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">👥 الحاضرون</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-5xl font-bold text-blue-600">
                  {attendanceCount}
                </p>
                <p className="text-sm text-gray-600 mt-2">طالب</p>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">⚙️ إجراءات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push(`/teacher/session/${sessionId}/attendance`)}
                >
                  عرض قائمة الحاضرين
                </Button>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={fetchAttendance}
                >
                  🔄 تحديث
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**ما تتعلمه:**
- ✅ QR Code generation
- ✅ Real-time updates (polling)
- ✅ Timers و setInterval
- ✅ Dynamic params
- ✅ Conditional styling
- ✅ Time formatting

---

## 🎨 Bonus Task 7: إضافة Animations

### الملف: استخدام Framer Motion

```typescript
// في أي صفحة
import { motion } from 'framer-motion';

export default function AnimatedPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* محتوى الصفحة */}
    </motion.div>
  );
}
```

**أمثلة Animations:**
```typescript
// Card يظهر بحركة
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  whileHover={{ scale: 1.05 }}
  transition={{ duration: 0.3 }}
>
  <Card>...</Card>
</motion.div>

// List items تظهر واحد تلو الآخر
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ x: -50, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: i * 0.1 }}
  >
    {item.content}
  </motion.div>
))}
```

---

## 📊 Bonus Task 8: إضافة Charts

### الملف: `src/app/student/stats/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

export default function StatsPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const response = await api.get('/attendance/stats');
    // تنسيق البيانات للـ chart
    const formatted = response.data.data.map((item: any) => ({
      name: item.material,
      value: item.count,
    }));
    setData(formatted);
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>📊 إحصائيات الحضور</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔐 Bonus Task 9: Middleware للحماية

### الملف: `middleware.ts` (في الـ root)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // الصفحات المحمية
  const protectedRoutes = ['/student', '/teacher', '/admin'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  // إذا محمية ومافي token
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*'],
};
```

**ما تتعلمه:**
- ✅ Next.js Middleware
- ✅ Route protection
- ✅ Cookies handling
- ✅ Redirects

---

## 🌙 Bonus Task 10: Dark Mode

### الملف: `src/components/ThemeProvider.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

**الاستخدام:**
```typescript
// في أي component
import { useTheme } from '@/components/ThemeProvider';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
}
```

---

## ✅ Checklist الكامل

### Task 1: Setup ⏱️ 30-60 دقيقة
- [ ] إنشاء مشروع Next.js
- [ ] تثبيت dependencies الأساسية
- [ ] shadcn/ui setup
- [ ] Environment variables
- [ ] تشغيل `npm run dev`

### Task 2: Login Page ⏱️ 45-90 دقيقة
- [ ] إنشاء `api.ts`
- [ ] إنشاء `authStore.ts`  
- [ ] صفحة Login تشتغل
- [ ] التنقل للـ dashboard يشتغل
- [ ] Toast notifications تظهر

### Task 3: Student Dashboard ⏱️ 60-90 دقيقة
- [ ] Student Dashboard يظهر
- [ ] البيانات تتحمل من API
- [ ] Logout يشتغل
- [ ] Stats تظهر بشكل صحيح

### Task 4: QR Scanner ⏱️ 45-60 دقيقة
- [ ] Scanner component يشتغل
- [ ] Camera permissions تعمل
- [ ] QR parsing يشتغل
- [ ] Attendance marking يشتغل

### Task 5: Teacher Dashboard ⏱️ 60-90 دقيقة
- [ ] Teacher Dashboard يظهر
- [ ] Materials list يعرض
- [ ] Sessions list يعرض
- [ ] Create session يشتغل

### Task 6: QR Display ⏱️ 45-60 دقيقة
- [ ] QR Code يظهر بشكل صحيح
- [ ] Timer يعمل
- [ ] Real-time count يتحدث
- [ ] Session details تظهر

### Bonus Tasks (اختياري):
- [ ] Framer Motion animations
- [ ] Recharts للإحصائيات
- [ ] Middleware للحماية
- [ ] Dark mode
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Form validation مع zod

---

## 🚀 خطة التنفيذ السريعة (اليوم الواحد)

### 🌅 الصباح (3-4 ساعات)
1. **Task 1:** Setup المشروع (30-60 دقيقة)
2. **Task 2:** Login Page (45-90 دقيقة)
3. **Task 3:** Student Dashboard (60-90 دقيقة)

**استراحة 15 دقيقة ☕**

### 🌞 بعد الظهر (3-4 ساعات)
4. **Task 4:** QR Scanner (45-60 دقيقة)
5. **Task 5:** Teacher Dashboard (60-90 دقيقة)
6. **Task 6:** QR Display (45-60 دقيقة)

**استراحة 15 دقيقة ☕**

### 🌆 المساء (2-3 ساعات)
7. **Testing:** اختبار كل الميزات
8. **Bonus:** إضافة animations أو charts
9. **Polish:** تحسين UI/UX

---

## 🐛 المشاكل الشائعة والحلول

### 1. CORS Error
```typescript
// في Backend: src/app.ts
import cors from 'cors';

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
```

### 2. Camera Permissions
```typescript
// طلب permissions قبل Scanner
useEffect(() => {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(() => console.log('Camera allowed'))
    .catch(() => toast.error('السماح بالكاميرا مطلوب'));
}, []);
```

### 3. TypeScript Errors
```bash
# إعادة توليد types
npm run build
# أو تجاهل مؤقتاً
// @ts-ignore
```

### 4. Environment Variables لا تعمل
```bash
# تأكد من البادئة NEXT_PUBLIC_
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# أعد تشغيل Server
ctrl+c
npm run dev
```

### 5. shadcn components لا تعمل
```bash
# تأكد من تثبيت dependencies
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

---

## 📚 مصادر التعلم الإضافية

### Next.js Official
- [Next.js Docs](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### Libraries
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org/)

### YouTube
- [Codevolution](https://www.youtube.com/@Codevolution) - الكورس اللي شفته
- [Web Dev Simplified](https://www.youtube.com/@WebDevSimplified)

---

## 🎓 ما تعلمته من هذا المشروع

بعد إكمال كل Tasks، راح تكون تعلمت:

### Next.js Core Concepts
✅ App Router  
✅ Server & Client Components  
✅ Route Groups  
✅ Dynamic Routes  
✅ Navigation (Link, useRouter)  
✅ Metadata  
✅ Loading & Error States  

### React Advanced
✅ Hooks (useState, useEffect, useContext)  
✅ Custom Hooks  
✅ Form Handling  
✅ Error Boundaries  
✅ Conditional Rendering  

### State Management
✅ Zustand  
✅ localStorage  
✅ Context API  

### API Integration
✅ Axios setup  
✅ Interceptors  
✅ Error handling  
✅ Loading states  
✅ Real-time polling  

### UI/UX
✅ Tailwind CSS  
✅ shadcn/ui  
✅ Responsive Design  
✅ Animations  
✅ Dark Mode  

### Advanced Features
✅ QR Code generation & scanning  
✅ Camera permissions  
✅ Real-time updates  
✅ Charts & Data visualization  
✅ Middleware  
✅ Protected routes  

---

## 🏆 التحدي النهائي

بعد ما تكمل كل Tasks، حاول:

1. **Deploy المشروع:**
   - Frontend: Vercel
   - Backend: Railway أو Render

2. **إضافة ميزات جديدة:**
   - تقارير PDF للحضور
   - إشعارات Push
   - Multi-language support
   - Offline mode

3. **Code Quality:**
   - إضافة ESLint rules
   - Testing مع Jest
   - Documentation
   - Git best practices

---

**الآن ابدأ بـ Task 1! وإذا واجهت أي مشكلة، لا تتردد تسأل! 🚀**

**تذكر:** المهم التطبيق والممارسة، مو مجرد المشاهدة. كل bug راح يعلمك شي جديد! 💪

