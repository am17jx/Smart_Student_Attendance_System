# 💻 توثيق الواجهة الأمامية (Frontend Documentation)

## 🛠️ التقنيات المستخدمة

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| React | 18.x | مكتبة واجهات المستخدم |
| Vite | 5.x | أداة البناء |
| TypeScript | 5.x | لغة البرمجة |
| TanStack Query | 5.x | إدارة حالة الخادم |
| React Router | 6.x | التوجيه |
| Tailwind CSS | 4.x | التنسيق |
| Shadcn/ui | latest | مكونات UI |
| Recharts | 2.x | الرسوم البيانية |
| Lucide React | latest | الأيقونات |

---

## 📁 هيكل المشروع

```
front-end/smooth-frontend/
├── src/
│   ├── components/          # المكونات القابلة لإعادة الاستخدام
│   │   ├── layout/          # مكونات التخطيط
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AppSidebar.tsx
│   │   └── ui/              # مكونات Shadcn/ui
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── table.tsx
│   │       └── ...
│   │
│   ├── pages/               # صفحات التطبيق
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Sessions.tsx
│   │   ├── ScanQR.tsx
│   │   ├── Students.tsx
│   │   ├── Teachers.tsx
│   │   ├── Materials.tsx
│   │   ├── Departments.tsx
│   │   ├── Stages.tsx
│   │   ├── Geofences.tsx
│   │   ├── Attendance.tsx
│   │   ├── FailedAttempts.tsx
│   │   └── Settings.tsx
│   │
│   ├── contexts/            # React Contexts
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/               # Custom Hooks
│   │   └── use-toast.ts
│   │
│   ├── lib/                 # أدوات ومساعدات
│   │   ├── api.ts           # عميل API
│   │   └── utils.ts         # دوال مساعدة
│   │
│   ├── App.tsx              # المكون الرئيسي
│   ├── main.tsx             # نقطة الدخول
│   └── index.css            # التنسيقات العامة
│
├── public/                  # الملفات الثابتة
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 📄 الصفحات

### Login.tsx
صفحة تسجيل الدخول.

**المميزات:**
- اختيار نوع المستخدم (طالب، أستاذ، إداري)
- التحقق من البيانات
- معالجة الأخطاء

### Dashboard.tsx
لوحة التحكم الرئيسية.

**تعرض حسب الدور:**
- **الطالب**: إحصائيات الحضور، رسم بياني، آخر الحضور
- **الأستاذ**: عدد المواد، الجلسات، المحاولات الفاشلة
- **الإداري**: إحصائيات عامة، نشاط حديث

### Sessions.tsx
إدارة الجلسات.

**الوظائف:**
- عرض جميع الجلسات
- إنشاء جلسة جديدة
- عرض QR Code
- إنهاء الجلسة

### ScanQR.tsx
مسح رمز QR.

**المميزات:**
- الوصول للكاميرا
- الوصول للموقع
- إرسال البيانات للخادم
- عرض النتيجة

### Students.tsx / Teachers.tsx
إدارة المستخدمين.

**الوظائف:**
- عرض القائمة مع pagination
- البحث والفلترة
- إضافة / تعديل / حذف

### Attendance.tsx
سجل الحضور.

**للطالب:**
- عرض سجلات الحضور الشخصية
- الفلترة حسب المادة

**للأستاذ:**
- إحصائيات تفصيلية
- رسوم بيانية

---

## 🧩 المكونات الرئيسية

### DashboardLayout
تخطيط الصفحات الداخلية مع Sidebar.

```tsx
<DashboardLayout>
  <PageContent />
</DashboardLayout>
```

### AppSidebar
القائمة الجانبية مع عناصر مختلفة حسب الدور.

### DataTable
جدول بيانات مع:
- البحث
- الفلترة
- Pagination

### LoadingSpinner
مؤشر التحميل.

### StatCard
بطاقة إحصائية.

```tsx
<StatCard
  title="إجمالي الطلاب"
  value={150}
  icon={Users}
  variant="primary"
/>
```

---

## 🔗 API Client

**الملف:** `lib/api.ts`

### الإعداد

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });
  
  return response.json();
}
```

### APIs المتاحة

```typescript
// المصادقة
authApi.login(credentials)
authApi.logout()
authApi.getProfile()

// الجلسات
sessionsApi.getAll()
sessionsApi.create(data)
sessionsApi.getById(id)
sessionsApi.end(id)

// QR Code
qrApi.generate(sessionId)
qrApi.validate(data)

// الحضور
attendanceApi.getMyRecords()
attendanceApi.getSessionAttendance(sessionId)

// لوحة التحكم
dashboardApi.getStudentDashboard()
dashboardApi.getTeacherDashboard()
dashboardApi.getAdminDashboard()

// CRUD APIs
studentsApi, teachersApi, materialsApi, 
departmentsApi, stagesApi, geofencesApi
```

---

## 🔐 AuthContext

**الملف:** `contexts/AuthContext.tsx`

### الحالة

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
}
```

### الاستخدام

```tsx
function MyComponent() {
  const { user, login, logout } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <div>مرحباً {user.name}</div>;
}
```

---

## 🎨 التنسيق

### Tailwind CSS

النظام يستخدم Tailwind CSS v4 مع:

**الألوان المخصصة:**
```css
:root {
  --primary: hsl(142, 76%, 36%);
  --secondary: hsl(240, 4.8%, 95.9%);
  --destructive: hsl(0, 84.2%, 60.2%);
  --success: hsl(142, 76%, 36%);
  --warning: hsl(38, 92%, 50%);
}
```

**الفئات المخصصة:**
```css
.gradient-primary { ... }
.gradient-success { ... }
.shadow-card { ... }
.glass-effect { ... }
```

---

## 📊 الرسوم البيانية

### Recharts

```tsx
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

<PieChart width={400} height={300}>
  <Pie
    data={data}
    dataKey="value"
    nameKey="name"
  >
    {data.map((entry, index) => (
      <Cell key={index} fill={COLORS[index]} />
    ))}
  </Pie>
  <Tooltip />
</PieChart>
```

---

## 🔧 أوامر البناء

```bash
# تطوير
npm run dev

# بناء
npm run build

# معاينة البناء
npm run preview

# فحص الكود
npm run lint

# اختبار
npm run test
```

---

## 📝 أفضل الممارسات

1. **استخدم TypeScript** لجميع الملفات
2. **استخدم TanStack Query** لجلب البيانات
3. **استخدم مكونات Shadcn/ui** قدر الإمكان
4. **تجنب inline styles** - استخدم Tailwind
5. **فصل الـ API calls** عن المكونات
6. **استخدم React.memo** للمكونات الثقيلة
